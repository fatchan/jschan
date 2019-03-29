'use strict';

const express  = require('express')
	, router = express.Router()
	, utils = require('../utils.js')
	, Posts = require(__dirname+'/../models/posts.js')
	, Boards = require(__dirname+'/../models/boards.js')
	, files = require(__dirname+'/../helpers/file.js')

// make new post
router.post('/board/:board', Boards.exists, async (req, res, next) => {

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

	let filename = '';
	//we got a file
	if (req.files != null && Object.keys(req.files).length > 0) {
		try {
			// save and thumb it
			filename = await files.uploadAndThumb(req, res);
		} catch (err) {
			console.error(err);
			return res.status(500).json({ 'message': 'Error uploading file' });
		}
	}

	const data = {
        'author': req.body.author || 'Anonymous',
        'subject': req.body.subject || '',
        'date': new Date(),
        'content': req.body.content,
        'thread': req.body.thread || null,
        'file': filename
    };

	const post = await Posts.insertOne(req.params.board, data)

	const redirect = '/' + req.params.board + '/thread/' + (req.body.thread || post.insertedId);

	return res.redirect(redirect);

});

// delete a post
router.delete('/board/:board/post/:id(\\d+)', Boards.exists, async (req, res, next) => {

});

// get recent threads and preview posts
router.get('/board/:board/recent/:page(\\d+)?', Boards.exists, async (req, res, next) => {

	//get the recently bumped thread & preview po	let threads;
	try {
		threads = await Posts.getRecent(req.params.board, req.params.page || 1);
	} catch (err) {
		return res.status(500).json({ 'message': 'Error fetching from DB' });
	}

	if (!threads || threads.lenth === 0) {
		return res.status(404).json({ 'message': 'Not found' });
	}

	return res.json(threads)

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
	for (let i = 0; i < 3; i++) {
		const thread = await Posts.insertOne('b', {
			'author': 'Anonymous',
			'subject': 'subject',
			'date': new Date(),
			'content': Math.random().toString(36).replace(/[^a-z]+/g, ''),
			'thread': null
		})
		for (let j = 0; j < 5; j++) {
			await new Promise(resolve => {setTimeout(resolve, 500)})
			const post = await Posts.insertOne('b', {
				'author': 'Anonymous',
				'subject': 'subject',
				'date': new Date(),
				'content': Math.random().toString(36).replace(/[^a-z]+/g, ''),
				'thread': thread.insertedId + ''
			})
		}
	}
})();
*/


module.exports = router;

