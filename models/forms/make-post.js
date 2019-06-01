'use strict';

const path = require('path')
	, util = require('util')
	, crypto = require('crypto')
	, randomBytes = util.promisify(crypto.randomBytes)
	, { remove, pathExists } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, Posts = require(__dirname+'/../../db/posts.js')
	, getTripCode = require(__dirname+'/../../helpers/tripcode.js')
	, linkQuotes = require(__dirname+'/../../helpers/quotes.js')
	, simpleMarkdown = require(__dirname+'/../../helpers/markdown.js')
	, sanitize = require('sanitize-html')
	, sanitizeOptions = {
		allowedTags: [ 'span', 'a', 'em', 'strong', 'small' ],
		allowedAttributes: {
			'a': [ 'href', 'class' ],
			'span': [ 'class' ]
		}
	}
	, nameRegex = /^(?<name>[^\s#]+)?(?:##(?<tripcode>[^ ]{1}[^\s#]+))?(?:## (?<capcode>[^\s#]+))?$/
	, permsCheck = require(__dirname+'/../../helpers/hasperms.js')
	, imageUpload = require(__dirname+'/../../helpers/files/imageupload.js')
	, videoUpload = require(__dirname+'/../../helpers/files/videoupload.js')
	, fileCheckMimeType = require(__dirname+'/../../helpers/files/file-check-mime-types.js')
	, imageThumbnail = require(__dirname+'/../../helpers/files/image-thumbnail.js')
	, imageIdentify = require(__dirname+'/../../helpers/files/image-identify.js')
	, videoThumbnail = require(__dirname+'/../../helpers/files/video-thumbnail.js')
	, videoIdentify = require(__dirname+'/../../helpers/files/video-identify.js')
	, formatSize = require(__dirname+'/../../helpers/files/format-size.js')
	, { buildCatalog, buildThread, buildBoard, buildBoardMultiple } = require(__dirname+'/../../build.js');

module.exports = async (req, res, next, numFiles) => {

	// check if this is responding to an existing thread
	let redirect = `/${req.params.board}/`
	let salt = null;
	let thread = null;
	const hasPerms = permsCheck(req, res);
	const forceAnon = res.locals.board.settings.forceAnon;
	if (req.body.thread) {
		thread = await Posts.getPost(req.params.board, req.body.thread, true);
		if (!thread || thread.thread != null) {
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': 'Thread does not exist.',
				'redirect': redirect
			});
		}
		salt = thread.salt;
		redirect += `thread/${req.body.thread}.html`
		if (thread.locked && !hasPerms) {
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': 'Thread Locked',
				'redirect': redirect
			});
		}
		if (thread.replyposts >= res.locals.board.settings.replyLimit) { //reply limit
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': 'Thread reached reply limit',
				'redirect': redirect
			});
		}
	}
	if (numFiles > res.locals.board.settings.maxFiles) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'message': `Too many files. Max files per post is ${res.locals.board.settings.maxFiles}.`,
			'redirect': redirect
		});
	}
	let files = [];
	// if we got a file
	if (numFiles > 0) {
		// check all mime types befoer we try saving anything
		for (let i = 0; i < numFiles; i++) {
			if (!fileCheckMimeType(req.files.file[i].mimetype, {animatedImage: true, image: true, video: true})) {
				return res.status(400).render('message', {
					'title': 'Bad request',
					'message': `Invalid file type for ${req.files.file[i].name}. Mimetype ${req.files.file[i].mimetype} not allowed.`,
					'redirect': redirect
				});
			}
		}
		// then upload, thumb, get metadata, etc.
		for (let i = 0; i < numFiles; i++) {
			const file = req.files.file[i];
			const filename = file.sha256 + path.extname(file.name);
			file.filename = filename; //for error to delete failed files

			//get metadata
			let processedFile = {
					hash: file.sha256,
					filename: filename,
					originalFilename: file.name,
					mimetype: file.mimetype,
					size: file.size,
			};

			//check if already exists
			const existsFull = await pathExists(`${uploadDirectory}img/${filename}`);
			const existsThumb = await pathExists(`${uploadDirectory}img/thumb-${filename.split('.')[0]}.jpg`);

			//handle video/image ffmpeg or graphicsmagick
			const mainType = file.mimetype.split('/')[0];
			switch (mainType) {
				case 'image':
					const imageData = await imageIdentify(req.files.file[i].tempFilePath, null, true);
					processedFile.geometry = imageData.size // object with width and height pixels
					processedFile.sizeString = formatSize(processedFile.size) // 123 Ki string
					processedFile.geometryString = imageData.Geometry // 123 x 123 string
					processedFile.hasThumb = !(fileCheckMimeType(file.mimetype, {image: true})
						&& processedFile.geometry.height <= 128
						&& processedFile.geometry.width <= 128);
					if (!existsFull) {
						await imageUpload(file, filename, 'img');
					}
					if (!existsThumb && processedFile.hasThumb) {
						await imageThumbnail(filename);
					}
					break;
				case 'video':
					//video metadata
					const videoData = await videoIdentify(req.files.file[i].tempFilePath, null, true);
					videoData.streams = videoData.streams.filter(stream => stream.width != null); //filter to only video streams or something with a resolution
					processedFile.duration = videoData.format.duration;
					processedFile.durationString = new Date(videoData.format.duration*1000).toLocaleString('en-US', {hour12:false}).split(' ')[1].replace(/^00:/, '');
					processedFile.geometry = {width: videoData.streams[0].coded_width, height: videoData.streams[0].coded_height} // object with width and height pixels
					processedFile.sizeString = formatSize(processedFile.size) // 123 Ki string
					processedFile.geometryString = `${processedFile.geometry.width}x${processedFile.geometry.height}` // 123 x 123 string
					processedFile.hasThumb = true;
					if (!existsFull) {
						await videoUpload(file, filename, 'img');
					}
					if (!existsThumb) {
						await videoThumbnail(filename, processedFile.geometry);
					}
					break;
				default:
					throw new Error(`invalid file mime type: ${mainType}`); //throw so goes to error handler before next'ing
			}

			//delete the temp file
			await remove(file.tempFilePath);

			//handle gifs with multiple geometry and size
			if (Array.isArray(processedFile.geometry)) {
				processedFile.geometry = processedFile.geometry[0];
			}
			if (Array.isArray(processedFile.sizeString)) {
				processedFile.sizeString = processedFile.sizeString[0];
			}
			if (Array.isArray(processedFile.geometryString)) {
				processedFile.geometryString = processedFile.geometryString[0];
			}
			files.push(processedFile);

		}
	}

	//poster ip
	const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;

	let userId = null;
	if (!salt) {
		//thread salt for IDs
		salt = (await randomBytes(128)).toString('hex');
	}
	if (res.locals.board.settings.ids) {
		const fullUserIdHash = crypto.createHash('sha256').update(salt + ip).digest('hex');
		userId = fullUserIdHash.substring(fullUserIdHash.length-6);
	}

	//forceanon hide reply subjects so cant be used as name for replies
	//forceanon only allow sage email
	let subject = (hasPerms || !forceAnon || !req.body.thread) ? req.body.subject : null;
	let email = (hasPerms || !forceAnon || req.body.email === 'sage') ? req.body.email : null;

	let name = res.locals.board.settings.defaultName;
	let tripcode = null;
	let capcode = null;
	if ((hasPerms || !forceAnon) && req.body.name && req.body.name.length > 0) {
		// get matches with named groups for name, trip and capcode in 1 regex
		const matches = req.body.name.match(nameRegex);
		if (matches && matches.groups) {
			const groups = matches.groups;
			//name
			if (groups.name) {
				name = groups.name;
			}
			//tripcode
			if (groups.tripcode) {
				tripcode = `!!${(await getTripCode(groups.tripcode))}`;
			}
			//capcode
			if (groups.capcode && hasPerms) {
				// TODO: add proper code for different capcodes
				capcode = `## ${groups.capcode}`;
			}
		}
	}

	//simple markdown and sanitize
	let message = req.body.message;
	let quotes = [];
	if (message && message.length > 0) {
		message = simpleMarkdown(req.params.board, req.body.thread, message);
		const { quotedMessage, threadQuotes } = await linkQuotes(req.params.board, message);
		message = quotedMessage;
		quotes = threadQuotes;
		message = sanitize(message, sanitizeOptions);
	}

	//build post data for db
	const data = {
		'date': new Date(),
		name,
		'board': req.params.board,
		tripcode,
		capcode,
		subject,
		'message': message || null,
		'thread': req.body.thread || null,
		'password': req.body.password || null,
		email,
		'salt': !req.body.thread ? salt : null,
		'spoiler': req.body.spoiler ? true : false,
		'banmessage': null,
		userId,
		ip,
		files,
		'reports': [],
		'globalreports': [],
		quotes
	}

	if (!req.body.thread) {
		//if this is a thread, add replies, sticky, sage, lock, etc
		Object.assign(data, {
			'replyposts': 0,
			'replyfiles': 0,
			'sticky': false,
			'locked': false,
			'saged': false
		});
	}

	const postId = await Posts.insertOne(req.params.board, data, thread);
	const successRedirect = `/${req.params.board}/thread/${req.body.thread || postId}.html#${postId}`;

	//build just the thread they need to see first and send them immediately
	await buildThread(data.thread || postId, res.locals.board);
	res.redirect(successRedirect);

	//now rebuild other pages
	const parallelPromises = []
	if (data.thread) {
		//refersh pages
		const threadPage = await Posts.getThreadPage(req.params.board, thread);
		if (data.email === 'sage' || thread.sage) {
			//refresh the page that the thread is on
			parallelPromises.push(buildBoard(res.locals.board, threadPage));
		} else {
			//if not saged, it will bump so we should refresh any pages above it as well
			parallelPromises.push(buildBoardMultiple(res.locals.board, 1, threadPage));
		}
	} else {
		//new thread, rebuild all pages and prunes old threads
		const prunedThreads = await Posts.pruneOldThreads(req.params.board, res.locals.board.settings.threadLimit);
		for (let i = 0; i < prunedThreads.length; i++) {
			parallelPromises.push(remove(`${uploadDirectory}html/${req.params.board}/thread/${prunedThreads[i]}.html`));
		}
		parallelPromises.push(buildBoardMultiple(res.locals.board, 1, 10));
	}

	//always rebuild catalog for post counts and ordering
	parallelPromises.push(buildCatalog(res.locals.board));

	//finish building other pages
	await Promise.all(parallelPromises);

}
