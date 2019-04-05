'use strict';

const uuidv4 = require('uuid/v4')
    , path = require('path')
	, util = require('util')
	, crypto = require('crypto')
	, randomBytes = util.promisify(crypto.randomBytes)
    , uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
    , Posts = require(__dirname+'/../../db-models/posts.js')
	, getTripCode = require(__dirname+'/../../helpers/tripcode.js')
	, simpleMarkdown = require(__dirname+'/../../helpers/markdown.js')
	, sanitize = require('sanitize-html')
	, sanitizeOptions = {
		allowedTags: [ 'span', 'a' ],
		allowedAttributes: {
			'a': [ 'href', 'class' ],
			'span': [ 'class' ]
		}
	}
    , fileUpload = require(__dirname+'/../../helpers/files/file-upload.js')
    , fileCheckMimeType = require(__dirname+'/../../helpers/files/file-check-mime-types.js')
    , imageThumbnail = require(__dirname+'/../../helpers/files/image-thumbnail.js')
    , imageIdentify = require(__dirname+'/../../helpers/files/image-identify.js')
    , videoThumbnail = require(__dirname+'/../../helpers/files/video-thumbnail.js')
    , videoIdentify = require(__dirname+'/../../helpers/files/video-identify.js')
    , formatSize = require(__dirname+'/../../helpers/files/format-size.js')

module.exports = async (req, res, numFiles) => {

	// check if this is responding to an existing thread
	let redirect = `/${req.params.board}`
	let salt = '';
	if (req.body.thread) {
		let thread;
		try {
			thread = await Posts.getPost(req.params.board, req.body.thread, true);
		} catch (err) {
			console.error(err);
			return res.status(500).render('error');
		}
		if (!thread || thread.thread != null) {
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': 'Thread does not exist.',
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
			if (!fileCheckMimeType(req.files.file[i].mimetype)) {
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
						return res.status(500).render('error'); //how did we get here?
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
				console.error(err);
				//TODO: DELETE FAILED FILES
				return res.status(500).render('error');
			}
		}
	}

	//post salt for IDs
	if (!salt) {
		salt = (await randomBytes(128)).toString('hex');
	}
	const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
	const userId = crypto.createHash('sha256').update(salt + ip + req.params.board).digest('hex').substring(0, 6);

	//tripcodes
	let name = req.body.name;
	//if it contains 2 hashtags
	const tripCodeIndex = name.indexOf('##');
	if (tripCodeIndex !== -1 ) {
		const passwordOnly = name.substring(tripCodeIndex+2);
		if (passwordOnly.length > 0) {
			const nameOnly = name.substring(0, tripCodeIndex);
			const tripcode = await getTripCode(passwordOnly);
			name = `${nameOnly}##${tripcode}`;
		}
	}

	//simple markdown and sanitize
	let message = req.body.message;
	if (message && message.length > 0) {
		message = sanitize(simpleMarkdown(req.params.board, req.body.thread, message), sanitizeOptions);
	}

	//add post to DB
	const data = {
		'board': req.params.board,
		'name': name || 'Anonymous',
		'subject': req.body.subject || '',
		'date': new Date(),
		'message': message || '',
		'thread': req.body.thread || null,
		'password': req.body.password || '',
		'userId': userId,
		'files': files,
		'salt': !req.body.thread ? salt : '',
		'reports': []
	};

	let postId;
	try {
		postId = await Posts.insertOne(req.params.board, data);
	} catch (err) {
		console.error(err);
		return res.status(500).render('error');
	}

	const successRedirect = `/${req.params.board}/thread/${req.body.thread || postId}`;

	return res.redirect(successRedirect);
}
