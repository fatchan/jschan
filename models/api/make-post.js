'use strict';

const uuidv4 = require('uuid/v4')
    , path = require('path')
	, util = require('util')
	, crypto = require('crypto')
	, randomBytes = util.promisify(crypto.randomBytes)
    , uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
    , Posts = require(__dirname+'/../../db-models/posts.js')
	, getTripCode = require(__dirname+'/../../helpers/tripcode.js')
    , fileUpload = require(__dirname+'/../../helpers/files/file-upload.js')
    , fileThumbnail = require(__dirname+'/../../helpers/files/file-thumbnail.js')
    , fileIdentify = require(__dirname+'/../../helpers/files/file-identify.js')
    , fileCheckMimeType = require(__dirname+'/../../helpers/files/file-check-mime-types.js');

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
			const filename = uuidv4() + path.extname(file.name);
			// try to save, thumbnail and get metadata
			try {
				await fileUpload(req, res, file, filename);
				const fileData = await fileIdentify(filename);
				await fileThumbnail(filename);
				const processedFile = {
					filename: filename,
					originalFilename: file.name,
					mimetype: file.mimetype,
					size: file.size, // size in bytes
					geometry: fileData.size, // object with width and height pixels
					sizeString: fileData.Filesize, // 123 Ki string
					geometryString: fileData.Geometry, // 123 x 123 string
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
	const password = name.substring(name.indexOf('##') + 2);
	if (password && password.length > 0) {
		name = name.substring(0, name.indexOf('##'));
		const tripcode = await getTripCode(password);
		name = `${name}##${tripcode}`;
	}

	//add post to DB
	const data = {
		'name': name || 'Anonymous',
		'subject': req.body.subject || '',
		'date': new Date(),
		'message': req.body.message || '',
		'thread': req.body.thread || null,
		'password': req.body.password || '',
		'files': files,
		'salt': salt,
	};
	const post = await Posts.insertOne(req.params.board, data)
	const successRedirect = `/${req.params.board}/thread/${req.body.thread || post.insertedId}`;

	return res.redirect(successRedirect);
}
