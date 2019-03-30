'use strict';

const express  = require('express')
	, router = express.Router()
	, utils = require('../utils.js')
	, Posts = require(__dirname+'/../models/posts.js')
	, Boards = require(__dirname+'/../models/boards.js')
	, uuidv4 = require('uuid/v4')
	, path = require('path')
	, uploadDirectory = require(__dirname+'/../helpers/uploadDirectory.js')
	, util = require('util')
	, fs = require('fs')
	, unlink = util.promisify(fs.unlink)
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

	//get all posts that were checked
	let posts;
	try {
		posts = await Posts.getPosts(req.params.board, req.body.checked);
	} catch (err) {
		return res.status(500).json({ 'message': 'Error fetching from DB' });
	}

	//filter it to ones that match the password
	posts = posts.filter(post => post.password == req.body.password);

	if (posts.length > 0) {

		const threadIds = posts.filter(x => x.thread == null).map(x => x._id);

		//get posts from all threads
		let threadPosts = []
		await Promise.all(threadIds.map(async id => {
			const currentThreadPosts = await Posts.getThreadPosts(req.params.board, id);
			threadPosts = threadPosts.concat(currentThreadPosts);
			return;
		}))

		//combine them all into one array
		const allPosts = posts.concat(threadPosts)

		//delete posts from DB
		let deletedPosts = 0;
		try {
			const result = await Posts.deleteMany(req.params.board, allPosts.map(x => x._id));
			deletedPosts = result.deletedCount;
		} catch (err) {
			return res.status(500).json({ 'message': 'Error deleting posts from DB' });
		}

		//get filenames from all the posts
		let fileNames = [];
		allPosts.forEach(post => {
			fileNames = fileNames.concat(post.files.map(x => x.filename))
		})

		//delete all the files using the filenames
		await Promise.all(fileNames.map(async filename => {
			//dont question it.
			return Promise.all([
				unlink(uploadDirectory + filename),
				unlink(uploadDirectory + 'thumb-' + filename)
			])
		}));

		//hooray!
		return res.json({ 'message': `deleted ${threadIds.length} threads and ${deletedPosts} posts` })

	}

	return res.status(403).json({ 'message': 'Password did not match any selected posts' })

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

