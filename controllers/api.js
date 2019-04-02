'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db-models/boards.js')
	, Posts = require(__dirname+'/../db-models/posts.js')
	, Trips = require(__dirname+'/../db-models/trips.js')
	, makePost = require(__dirname+'/../models/api/make-post.js')
	, deletePost = require(__dirname+'/../models/api/delete-post.js')
	, getRecent = require(__dirname+'/../models/api/get-recent.js')
	, getThread = require(__dirname+'/../models/api/get-thread.js')
	, getCatalog = require(__dirname+'/../models/api/get-catalog.js')
	, getBoards = require(__dirname+'/../models/api/get-boards.js');

// make new post
router.post('/board/:board', Boards.exists, (req, res, next) => {

	let numFiles = 0;
	if (req.files && req.files.file) {
		if (Array.isArray(req.files.file)) {
			numFiles = req.files.file.length;
		} else {
			numFiles = 1;
			req.files.file = [req.files.file];
		}
	}

	const errors = [];

	if (!req.body.message && numFiles === 0) {
		errors.push('Must provide a message or file');
	}
	if (req.body.message && req.body.message.length > 2000) {
		errors.push('Message must be 2000 characters or less');
	}
	if (!req.body.thread && (!req.body.message || req.body.message.length === 0)) {
		errors.push('Threads must include a message');
	}
	if (req.body.name && req.body.name.length > 50) {
		errors.push('Name must be 50 characters or less');
	}
	if (req.body.subject && req.body.subject.length > 50) {
		errors.push('Subject must be 50 characters or less');
	}
	if (req.body.password && req.body.password.length > 50) {
		errors.push('Password must be 50 characters or less');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}${req.body.thread ? '/thread/' + req.body.thread : ''}`
		})
	}

	makePost(req, res, numFiles);

});

// delete a post. using POST isntead of DELETE because of html forms supprot
router.post('/board/:board/delete', Boards.exists, (req, res, next) => {

	const errors = [];

	if (!req.body.password) {
		errors.push('Must provide a password')
	}
	if (req.body.password.length > 50) {
		errors.push('Password must be 50 characters or less')
	}
	if (!req.body.checked || req.body.checked.length === 0 || req.body.checked.length > 10) { //10 for now just for _some_ limit
		errors.push('Must check 1-10 boxes for posts to delete')
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}`
		})
	}

	deletePost(req, res);

});

// get recent threads and preview posts
router.get('/board/:board/recent/:page(\\d+)?', Boards.exists, getRecent);

// get a thread
router.get('/board/:board/thread/:id(\\d+)', Boards.exists, getThread);

// get array of threads (catalog)
router.get('/board/:board/catalog', Boards.exists, getCatalog);

//get list of boards
router.get('/boards', getBoards);

module.exports = router;
