'use strict';

const express  = require('express')
	, router = express.Router()
	, utils = require('../utils.js')
	, Posts = require(__dirname+'/../models/posts.js')
	, Boards = require(__dirname+'/../models/boards.js')
	, uuidv4 = require('uuid/v4')
	, path = require('path')
	, fileUpload = require(__dirname+'/../helpers/file-upload.js')
	, fileThumbnail = require(__dirname+'/../helpers/file-thumbnail.js')
	, fileIdentify = require(__dirname+'/../helpers/file-identify.js')
	, fileCheckMimeType = require(__dirname+'/../helpers/file-check-mime-types.js');

/*
(async () => {
	await Boards.deleteIncrement('b');
	await Boards.deleteAll();
	await Boards.insertOne({
		_id: 'b',
		name: 'random',
		description: 'post anything here',
	})
	await Posts.deleteAll('b');
})();
*/

// make new post
router.post('/board/:board', Boards.exists, async (req, res, next) => {

	//needs a refactor into a body validator of some sort
	const fileKeys = Object.keys(req.files);
	const numFiles = fileKeys.length
	if (!req.body.message && numFiles === 0) {
		return res.status(400).json({ 'message': 'Must provide a message or file' });
	}
	if (req.body.message && req.body.message.length > 2000) {
		return res.status(400).json({ 'message': 'Message must be 2000 characters or less' });
	}
	if (req.body.name && req.body.name.length > 50) {
		return res.status(400).json({ 'message': 'Name must be 50 characters or less' });
	}
	if (req.body.subject && req.body.subject.length > 50) {
		return res.status(400).json({ 'message': 'Subject must be 50 characters or less' });
	}
	if (req.body.password && req.body.password.length > 50) {
		return res.status(400).json({ 'message': 'Password must be 50 characters or less' });
	}

	// check if this is responding to an existing thread
	if (req.body.thread) {
		let thread;
		try {
			thread = await Posts.getThread(req.params.board, req.body.thread);
		} catch (err) {
			return res.status(500).json({ 'message': 'Error fetching from DB' });
		}
		if (!thread) {
			return res.status(400).json({ 'message': 'thread does not exist' })
		}
	}

	let files = [];
	// if we got a file
	if (numFiles > 0) {
		// check all mime types befoer we try saving anything
		for (let i = 0; i < numFiles; i++) {
			if (!fileCheckMimeType(req.files[fileKeys[i]].mimetype)) {
				return res.status(400).json({ 'message': 'Invalid file type' });
			}
		}
		// then upload, thumb, get metadata, etc.
		for (let i = 0; i < numFiles; i++) {
			const file = req.files[fileKeys[i]];
			const filename = uuidv4() + path.extname(file.name);
			// try to save, thumbnail and get metadata
			try {
				await fileUpload(req, res, filename);
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

				return res.status(500).json({ 'message': 'Error uploading file' });
			}
		}
	}

	const data = {
        'name': req.body.name || 'Anonymous',
        'subject': req.body.subject || '',
        'date': new Date(),
        'message': req.body.message || '',
        'thread': req.body.thread || null,
		'password': req.body.password || '',
        'files': files
    };

	const post = await Posts.insertOne(req.params.board, data)

	const redirect = '/' + req.params.board + '/thread/' + (req.body.thread || post.insertedId);

	return res.redirect(redirect);

});

// delete a post. using POST isntead of DELETE because of html forms supprot
router.post('/board/:board/delete', Boards.exists, async (req, res, next) => {

	if (!req.body.password) {
		return res.status(400).json({ 'message': 'Must provide a password' })
	}
	if (req.body.password.length > 50) {
		return res.status(400).json({ 'message': 'Password must be 50 characters or less' })
	}
	if (!req.body.checked || req.body.checked.length === 0 || req.body.checked.length > 10) { //10 for now just for _some_ limit
		return res.status(400).json({ 'message': 'Must check 1-10 boxes for posts to delete' })
	}

	let posts;
	try {
		posts = await Posts.getPosts(req.params.board, req.body.checked);
	} catch (err) {
		return res.status(500).json({ 'message': 'Error fetching from DB' });
	}

	let deleted = 0;

	await Promise.all(posts.map(async post =>{

		if (post.password != req.body.password) {
			return; // res.status(403).json({ 'message': 'Incorrect password' });
		}

		try {
			await Posts.deleteOne(req.params.board, {
				'_id': post._id
			});
		} catch (err) {
			return; // res.status(500).json({ 'message': 'Error deleting from DB' });
		}

		deleted++; //successfully deleted one

	}));

	return res.json({ 'message': `deleted: ${deleted} posts` })

});

// get recent threads and preview posts
router.get('/board/:board/recent/:page(\\d+)?', Boards.exists, async (req, res, next) => {

	//get the recently bumped thread & preview po	let threads;
	let threads;
	try {
		threads = await Posts.getRecent(req.params.board, req.params.page || 1);
	} catch (err) {
		return res.status(500).json({ 'message': 'Error fetching from DB' });
	}

	if (!threads || threads.lenth === 0) {
		return res.status(404).json({ 'message': 'Not found' });
	}

	return res.json(threads);

});

// get a thread
router.get('/board/:board/thread/:id(\\d+)', Boards.exists, async (req, res, next) => {

	//get the recently bumped thread & preview posts
	let thread;
	try {
		thread = await Posts.getThread(req.params.board, req.params.id);
	} catch (err) {
		return res.status(500).json({ 'message': 'Error fetching from DB' });
	}

	if (!thread) {
		return res.status(404).json({ 'message': 'Not found' });
	}

	return res.json(thread)

});

// get array of threads (catalog)
router.get('/board/:board/catalog', Boards.exists, async (req, res, next) => {

	//get the recently bumped thread & preview posts
	let data;
	try {
		data = await Posts.getCatalog(req.params.board);
	} catch (err) {
		return res.status(500).json({ 'message': 'Error fetching from DB' });
	}

	if (!data) {
		return res.status(404).json({ 'message': 'Not found' });
	}

	return res.json(data)

});

//get list of boards
router.get('/boards', Boards.exists, async (req, res, next) => {

	//get a list of boards
	let boards;
	try {
		boards = await Boards.find();
	} catch (err) {
		return res.status(500).json({ 'message': 'Error fetching from DB' })
	}

	//render the page
	res.json(boards)

});

module.exports = router;

