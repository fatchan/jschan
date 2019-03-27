'use strict';

const express  = require('express')
	, router = express.Router()
	, utils = require('../utils.js')
	, Posts = require(__dirname+'/../models/posts.js')
	, Boards = require(__dirname+'/../models/boards.js');

/*
roughly:
	- GET /api/board/:board/catalog -> all threads (catalog)
	- GET /api/board/:board/recent/:page? -> recent posts per page (board homepage)
	- GET /api/board/:board/thread/:thread -> get all posts in a thread

	- POST /api/board/:board -> make a new thread
	- POST /api/board/:board/thread/:thread -> make a new post in a thread

	- DELETE /api/board/:board/post/:id -> delete a post
*/

// make new post
router.post('/api/board/:board', Boards.exists, async (req, res, next) => {

});

// delete a post
router.delete('/api/board/:board/post/:id', Boards.exists, async (req, res, next) => {

});

// get recent threads and preview posts
router.get('/api/board/:board/recent/:page', Boards.exists, async (req, res, next) => {

	//get the recently bumped thread & preview posts
	let threads;
	try {
		threads = await Posts.getRecent(req.params.board, req.params.page || 1);
	} catch (err) {
		return next(err);
	}

	if (!threads || threads.lenth === 0) {
		return next();
	}

	return res.json(threads)

});

// get a thread
router.get('/api/board/:board/thread/:thread([a-f\d]{24})', Boards.exists, async (req, res, next) => {

	//get the recently bumped thread & preview posts
	let thread;
	try {
		thread = await Posts.getThread(req.params.board, req.params.thread);
	} catch (err) {
		return next(err);
	}

	if (!thread) {
		return next();
	}

	return res.json(thread)

});

// get array of threads (catalog)
router.get('/api/board/:board/catalog', Boards.exists, async (req, res, next) => {

	//get the recently bumped thread & preview posts
	let data;
	try {
		data = await Posts.getCatalog(req.params.board);
	} catch (err) {
		return next(err);
	}

	if (!data) {
		return next();
	}

	return res.json(data)

});

/*
(async () => {
	await Boards.deleteAll();
	await Boards.insertOne({
		_id: 'b',
		name: 'random',
		title: 'random posts',
		description: 'post anything here',
	})
	await Posts.deleteAll('b');
	for (let i = 0; i < 5; i++) {
		const thread = await Posts.insertOne('b', {
			'author': 'Anonymous',
			'title': 'post title',
			'date': new Date(),
			'content': Math.random().toString(36).replace(/[^a-z]+/g, ''),
			'thread': null
		})
		for (let j = 0; j < 30; j++) {
			await new Promise(resolve => {setTimeout(resolve, 500)})
			const post = await Posts.insertOne('b', {
				'author': 'Anonymous',
				'title': 'post title',
				'date': new Date(),
				'content': Math.random().toString(36).replace(/[^a-z]+/g, ''),
				'thread': thread.insertedId
			})
		}
	}
})();
*/

module.exports = router;

