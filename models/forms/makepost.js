'use strict';

const path = require('path')
	, { createHash, randomBytes } = require('crypto')
	, { remove, pathExists } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, Posts = require(__dirname+'/../../db/posts.js')
	, getTripCode = require(__dirname+'/../../helpers/posting/tripcode.js')
	, linkQuotes = require(__dirname+'/../../helpers/posting/quotes.js')
	, simpleMarkdown = require(__dirname+'/../../helpers/posting/markdown.js')
	, sanitize = require('sanitize-html')
	, sanitizeOptions = {
		allowedTags: [ 'span', 'a', 'em', 'strong', 'small' ],
		allowedAttributes: {
			'a': [ 'href', 'class' ],
			'span': [ 'class' ]
		}
	}
	, nameRegex = /^(?<name>[^\s#]+)?(?:##(?<tripcode>[^ ]{1}[^\s#]+))?(?:## (?<capcode>[^\s#]+))?$/
	, permsCheck = require(__dirname+'/../../helpers/checks/hasperms.js')
	, imageUpload = require(__dirname+'/../../helpers/files/imageupload.js')
	, videoUpload = require(__dirname+'/../../helpers/files/videoupload.js')
	, fileCheckMimeType = require(__dirname+'/../../helpers/files/mimetypes.js')
	, imageThumbnail = require(__dirname+'/../../helpers/files/imagethumbnail.js')
	, imageIdentify = require(__dirname+'/../../helpers/files/imageidentify.js')
	, videoThumbnail = require(__dirname+'/../../helpers/files/videothumbnail.js')
	, videoIdentify = require(__dirname+'/../../helpers/files/videoidentify.js')
	, formatSize = require(__dirname+'/../../helpers/files/formatsize.js')
	, deleteTempFiles = require(__dirname+'/../../helpers/files/deletetempfiles.js')
	, deletePosts = require(__dirname+'/deletepost.js')
	, { buildCatalog, buildThread, buildBoard, buildBoardMultiple } = require(__dirname+'/../../helpers/build.js');

module.exports = async (req, res, next) => {

	// check if this is responding to an existing thread
	let redirect = `/${req.params.board}/`
	let salt = null;
	let thread = null;
	const hasPerms = permsCheck(req, res);
	const forceAnon = res.locals.board.settings.forceAnon;
	if (req.body.thread) {
		thread = await Posts.getPost(req.params.board, req.body.thread, true);
		if (!thread || thread.thread != null) {
			await deleteTempFiles(req).catch(e => console.error);
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': 'Thread does not exist.',
				'redirect': redirect
			});
		}
		salt = thread.salt;
		redirect += `thread/${req.body.thread}.html`
		if (thread.locked && !hasPerms) {
			await deleteTempFiles(req).catch(e => console.error);
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': 'Thread Locked',
				'redirect': redirect
			});
		}
		if (thread.replyposts >= res.locals.board.settings.replyLimit && !thread.cyclic) { //reply limit
			await deleteTempFiles(req).catch(e => console.error);
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': 'Thread reached reply limit',
				'redirect': redirect
			});
		}
	}
	if (res.locals.numFiles > res.locals.board.settings.maxFiles) {
		await deleteTempFiles(req).catch(e => console.error);
		return res.status(400).render('message', {
			'title': 'Bad request',
			'message': `Too many files. Max files per post is ${res.locals.board.settings.maxFiles}.`,
			'redirect': redirect
		});
	}
	let files = [];
	// if we got a file
	if (res.locals.numFiles > 0) {
		// check all mime types befoer we try saving anything
		for (let i = 0; i < res.locals.numFiles; i++) {
			if (!fileCheckMimeType(req.files.file[i].mimetype, {animatedImage: true, image: true, video: true})) {
				await deleteTempFiles(req).catch(e => console.error);
				return res.status(400).render('message', {
					'title': 'Bad request',
					'message': `Invalid file type for ${req.files.file[i].name}. Mimetype ${req.files.file[i].mimetype} not allowed.`,
					'redirect': redirect
				});
			}
		}
		// then upload, thumb, get metadata, etc.
		for (let i = 0; i < res.locals.numFiles; i++) {
			const file = req.files.file[i];
			const extension = path.extname(file.name);
			const filename = file.sha256 + extension;

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
					if (videoData.streams.length <= 0) {
						await deleteTempFiles(req).catch(e => console.error);
						return res.status(400).render('message', {
							'title': 'Bad request',
							'message': 'Audio only file not supported (yet)',
							'redirect': redirect
						});
					}
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
	// because express middleware is autistic i need to do this
	deleteTempFiles(req).catch(e => console.error);

	let userId = null;
	if (!salt) {
		//thread salt for IDs
		salt = (await randomBytes(128)).toString('base64');
	}
	if (res.locals.board.settings.ids) {
		const fullUserIdHash = createHash('sha256').update(salt + res.locals.ip).digest('hex');
		userId = fullUserIdHash.substring(fullUserIdHash.length-6);
	}

	//forceanon hide reply subjects so cant be used as name for replies
	//forceanon only allow sage email
	let subject = (hasPerms || !forceAnon || !req.body.thread) ? req.body.subject : null;
	let email = (hasPerms || !forceAnon || req.body.email === 'sage') ? req.body.email : null;

	//spoiler files only if board settings allow
	const spoiler = res.locals.board.settings.userPostSpoiler && req.body.spoiler ? true : false;

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
		message = simpleMarkdown(message);
		const { quotedMessage, threadQuotes } = await linkQuotes(req.params.board, message, req.body.thread || null);
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
		'nomarkup': req.body.message || null,
		'thread': req.body.thread || null,
		'password': req.body.password || null,
		email,
		spoiler,
		'banmessage': null,
		userId,
		'ip': res.locals.ip,
		files,
		'reports': [],
		'globalreports': [],
		quotes, //posts this post replies to
		'backlinks': [], //posts replying to this post
	}

	if (!req.body.thread) {
		//if this is a thread, add thread specific properties
		Object.assign(data, {
			'replyposts': 0,
			'replyfiles': 0,
			'sticky': false,
			'locked': false,
			'saged': false,
			'cyclic': false,
			'salt': salt
		});
	}

	const postId = await Posts.insertOne(res.locals.board, data, thread);

	//for cyclic threads, delete posts beyond bump limit
	if (thread && thread.cyclic && thread.replyposts > res.locals.board.settings.replyLimit) {
		const cyclicOverflowPosts = await Posts.db.find({
			'thread': data.thread,
			'board': req.params.board
		}).sort({
			'postId': -1,
		}).skip(res.locals.board.settings.replyLimit).toArray();
		await deletePosts(cyclicOverflowPosts, req.params.board);
	}

	const successRedirect = `/${req.params.board}/thread/${req.body.thread || postId}.html#${postId}`;
	console.log(`NEW POST -> ${successRedirect}`);

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
		//new thread, prunes any old threads before rebuilds
		const prunedThreads = await Posts.pruneOldThreads(res.locals.board);
//TODO: could add early404 here alongside thread pruning.
		if (prunedThreads.length > 0) {
			await deletePosts(prunedThreads, req.params.board);
		}
		parallelPromises.push(buildBoardMultiple(res.locals.board, 1, Math.ceil(res.locals.board.settings.threadLimit/10)));
	}

	//always rebuild catalog for post counts and ordering
	parallelPromises.push(buildCatalog(res.locals.board));

	//finish building other pages
	await Promise.all(parallelPromises);

}
