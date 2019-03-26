'use strict';

const express  = require('express')
	, router = express.Router()
	, { check, validationResult } = require('express-validator/check')
	, utils = require('../utils.js')
	, util = require('util')
	, fs = require('fs')
	, mkdir = util.promisify(fs.mkdir)
	, Posts = require(__dirname+'/../models/posts.js');

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
router.post('/api/board/:board', async (req, res, next) => {

});

// delete a post
router.delete('/api/board/:board/post/:id', async (req, res, next) => {

});

// get recent threads and preview posts
router.get('/api/board/:board/recent/:page', async (req, res, next) => {

	//make sure the board exists
	const boards = await Posts.checkBoard(req.params.board)
	if (boards.length <= 0) {
		return next();
	}

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
router.get('/api/board/:board/thread/:thread', async (req, res, next) => {

	//make sure the board exists
	const boards = await Posts.checkBoard(req.params.board)
	if (boards.length <= 0) {
		return next();
	}

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
router.get('/api/board/:board/catalog', async (req, res, next) => {

	//make sure the board exists
	const boards = await Posts.checkBoard(req.params.board)
	if (boards.length <= 0) {
		return next();
	}

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

// board page web frontend
router.get('/:board/:page?', async (req, res, next) => {

	//make sure the board exists
	const boards = await Posts.checkBoard(req.params.board)
	if (boards.length <= 0) {
		return next();
	}

	//get the recently bumped thread & preview posts
	let threads;
	try {
		threads = await Posts.getRecent(req.params.board, req.params.page);
	} catch (err) {
		return next(err);
	}

	//render the page
	res.render('board', {
		csrf: req.csrfToken(),
		board: req.params.board,
		threads: threads || []
	});

});

/*
(async () => {
	await Posts.deleteAll('b');
	for (let i = 0; i < 5; i++) {
		const thread = await Posts.insertOne('b', {
			'author': 'Anonymous',
			'date': new Date(),
			'content': Math.random().toString(36).replace(/[^a-z]+/g, ''),
			'thread': null
		})
		for (let j = 0; j < 5; j++) {
			await new Promise(resolve => {setTimeout(resolve, 500)})
			const post = await Posts.insertOne('b', {
				'author': 'Anonymous',
				'date': new Date(),
				'content': Math.random().toString(36).replace(/[^a-z]+/g, ''),
				'thread': thread.insertedId
			})
		}
	}
})();
*/

module.exports = router;

