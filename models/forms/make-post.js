'use strict';

const uuidv4 = require('uuid/v4')
	, path = require('path')
	, util = require('util')
	, crypto = require('crypto')
	, randomBytes = util.promisify(crypto.randomBytes)
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
	, formatSize = require(__dirname+'/../../helpers/files/format-size.js')

module.exports = async (req, res, next, numFiles) => {

	// check if this is responding to an existing thread
	let redirect = `/${req.params.board}`
	let salt = '';
	let thread;
	let hasPerms = permsCheck(req, res);
	if (req.body.thread) {
		try {
			thread = await Posts.getPost(req.params.board, req.body.thread, true);
		} catch (err) {
			return next(err);
		}
		if (!thread || thread.thread != null) {
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': 'Thread does not exist.',
				'redirect': redirect
			});
		}
		if (thread.locked && !hasPerms) {
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': 'Thread Locked',
				'redirect': redirect
			});
		}
		if (thread.replyposts >= 100) { //reply limit
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': 'Thread reached reply limit',
				'redirect': redirect
			});
		}
		salt = thread.salt;
		redirect += `/thread/${req.body.thread}`
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

			// try to save, thumbnail and get metadata
			try {

				//upload file
				await fileUpload(req, res, file, filename);

				//get metadata
				let processedFile = {
						filename: filename,
						originalFilename: file.name,
						mimetype: file.mimetype,
						size: file.size,
				};

				//handle video vs image ffmpeg vs graphicsmagick
				const mainType = file.mimetype.split('/')[0];
				switch (mainType) {
					case 'image':
						const imageData = await imageIdentify(filename);
						processedFile.geometry = imageData.size // object with width and height pixels
						processedFile.sizeString = formatSize(processedFile.size) // 123 Ki string
						processedFile.geometryString = imageData.Geometry // 123 x 123 string
						await imageThumbnail(filename);
						break;
					case 'video':
						//video metadata
						const videoData = await videoIdentify(filename);
						processedFile.geometry = {width: videoData.streams[0].coded_width, height: videoData.streams[0].coded_height} // object with width and height pixels
						processedFile.sizeString = formatSize(processedFile.size) // 123 Ki string
						processedFile.geometryString = `${processedFile.geometry.width}x${processedFile.geometry.height}` // 123 x 123 string
						await videoThumbnail(filename);
						break;
					default:
						return next(err);
				}

				//make thumbnail

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

			} catch (err) {
				//TODO: DELETE FAILED FILES
				return next(err);
			}
		}
	}

	//post salt for IDs
	if (!salt) {
		salt = (await randomBytes(128)).toString('hex');
	}
	const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
	const fullUserIdHash = crypto.createHash('sha256').update(salt + ip + req.params.board).digest('hex');
	const userId = fullUserIdHash.substring(fullUserIdHash.length-6);

	let name = null;
	let tripcode = null;
	let capcode = null;
	if (req.body.name && req.body.name.length > 0) {
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
		'name': name || 'Anonymous',
		'board': req.params.board,
		'tripcode': tripcode,
		'capcode': capcode,
		'subject': req.body.subject || null,
		'message': message || null,
		'thread': req.body.thread || null,
		'password': req.body.password || null,
		'email': req.body.email || null,
		'salt': !req.body.thread ? salt : null,
		'spoiler': req.body.spoiler ? true : false,
		'userId': userId,
		'ip': ip,
		'files': files,
		'reports': [],
		'globalreports': [],
		'replyposts': 0,
		'replyfiles': 0,
		'sticky': false,
		'locked': false,
		'saged': false,
	};

	let postId;
	try {
		postId = await Posts.insertOne(req.params.board, data, thread);
	} catch (err) {
		return next(err);
	}

	const successRedirect = `/${req.params.board}/thread/${req.body.thread || postId}#${postId}`;

	return res.redirect(successRedirect);
}
