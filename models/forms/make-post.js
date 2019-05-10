'use strict';

const uuidv4 = require('uuid/v4')
	, path = require('path')
	, util = require('util')
	, crypto = require('crypto')
	, randomBytes = util.promisify(crypto.randomBytes)
	, remove = require('fs-extra').remove
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, Posts = require(__dirname+'/../../db/posts.js')
	, getTripCode = require(__dirname+'/../../helpers/tripcode.js')
	, linkQuotes = require(__dirname+'/../../helpers/quotes.js')
	, simpleMarkdown = require(__dirname+'/../../helpers/markdown.js')
	, sanitize = require('sanitize-html')
	, sanitizeOptions = {
		allowedTags: [ 'span', 'a', 'em', 'strong' ],
		allowedAttributes: {
			'a': [ 'href', 'class' ],
			'span': [ 'class' ]
		}
	}
	, nameRegex = /^(?<name>[^\s#]+)?(?:##(?<tripcode>[^ ]{1}[^\s#]+))?(?:## (?<capcode>[^\s#]+))?$/
	, permsCheck = require(__dirname+'/../../helpers/hasperms.js')
	, fileUpload = require(__dirname+'/../../helpers/files/file-upload.js')
	, fileCheckMimeType = require(__dirname+'/../../helpers/files/file-check-mime-types.js')
	, imageThumbnail = require(__dirname+'/../../helpers/files/image-thumbnail.js')
	, imageIdentify = require(__dirname+'/../../helpers/files/image-identify.js')
	, videoThumbnail = require(__dirname+'/../../helpers/files/video-thumbnail.js')
	, videoIdentify = require(__dirname+'/../../helpers/files/video-identify.js')
	, formatSize = require(__dirname+'/../../helpers/files/format-size.js');

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
			if (!fileCheckMimeType(req.files.file[i].mimetype, {image: true, video: true})) {
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
			const uuid = uuidv4();
			const filename = uuid + path.extname(file.name);
			file.filename = filename; //for error to delete failed files

			//upload file
			await fileUpload(req, res, file, filename, 'img');

			//get metadata
			let processedFile = {
					filename: filename,
					originalFilename: file.name,
					mimetype: file.mimetype,
					size: file.size,
			};

			//handle video/image ffmpeg or graphicsmagick
			const mainType = file.mimetype.split('/')[0];
			switch (mainType) {
				case 'image':
					const imageData = await imageIdentify(filename, 'img');
					processedFile.geometry = imageData.size // object with width and height pixels
					processedFile.sizeString = formatSize(processedFile.size) // 123 Ki string
					processedFile.geometryString = imageData.Geometry // 123 x 123 string
					await imageThumbnail(filename);
					break;
				case 'video':
					//video metadata
					const videoData = await videoIdentify(filename);
					processedFile.duration = videoData.format.duration;
					processedFile.durationString = new Date(videoData.format.duration*1000).toLocaleString('en-US', {hour12:false}).split(' ')[1].replace(/^00:/, '');
					processedFile.geometry = {width: videoData.streams[0].coded_width, height: videoData.streams[0].coded_height} // object with width and height pixels
					processedFile.sizeString = formatSize(processedFile.size) // 123 Ki string
					processedFile.geometryString = `${processedFile.geometry.width}x${processedFile.geometry.height}` // 123 x 123 string
					await videoThumbnail(filename);
					break;
				default:
					return next(err);
			}

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
		const fullUserIdHash = crypto.createHash('sha256').update(salt + ip + req.params.board).digest('hex');
		userId = fullUserIdHash.substring(fullUserIdHash.length-6);
	}

	//forceanon hide reply subjects so cant be used as name for replies
	let subject = hasPerms || !forceAnon || !req.body.thread ? req.body.subject : null;
	//forceanon only allow sage email
	let email = hasPerms || !forceAnon || req.body.email === 'sage' ? req.body.email : null;
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
				name = groups.name
			}
			//tripcode
			if (groups.tripcode) {
				tripcode = `!!${(await getTripCode(groups.tripcode))}`;
			}
			//capcode
			if (groups.capcode && hasPerms) {
				// TODO: add proper code for different capcodes
				capcode = groups.capcode;
			}
		}
	}

	//simple markdown and sanitize
	let message = req.body.message;
	if (message && message.length > 0) {
		message = simpleMarkdown(req.params.board, req.body.thread, message);
		message = await linkQuotes(req.params.board, message);
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

	//now we need to delete outdated html
	const removePromises = []
	if (!data.thread) {
		//if we just added a new thread, prune any old ones
		const prunedThreads = await Posts.pruneOldThreads(req.params.board, res.locals.board.settings.threadLimit);
		for (let i = 0; i < prunedThreads.length; i++) {
			removePromises.push(remove(`${uploadDirectory}html/${req.params.board}/thread/${prunedThreads[i]}.html`));
		}
	}
	//always need to refresh catalog
	removePromises.push(remove(`${uploadDirectory}html/${req.params.board}/catalog.html`));
	if (data.thread) {
		//refresh the thread itself
		removePromises.push(remove(`${uploadDirectory}html/${req.params.board}/thread/${req.body.thread}.html`));
		//refersh pages
		const numThreadsBefore = await Posts.getBeforeCount(req.params.board, thread);
		const pagesToRemove = Math.ceil(numThreadsBefore/10) || 1;
		//refresh the page that the thread is on
		removePromises.push(remove(`${uploadDirectory}html/${req.params.board}/${pagesToRemove == 1 ? 'index' : pagesToRemove}.html`));
		if (!data.sage) {
			//if not saged, it will bump so we should refresh any pages above it as well
			for (let i = pagesToRemove-1; i >= 1; i--) {
				removePromises.push(remove(`${uploadDirectory}html/${req.params.board}/${i == 1 ? 'index' : i}.html`));
			}
		}
	} else {
		//new thread, remove all pages
		for (let i = 1; i <= Math.ceil(res.locals.board.settings.threadLimit/10); i++) {
			removePromises.push(remove(`${uploadDirectory}html/${req.params.board}/${i == 1 ? 'index' : i}.html`));
		}
	}
	await Promise.all(removePromises);

	const successRedirect = `/${req.params.board}/thread/${req.body.thread || postId}.html#${postId}`;

	return res.redirect(successRedirect);

}
