'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db-models/boards.js')
	, Posts = require(__dirname+'/../db-models/posts.js')
	, makePost = require(__dirname+'/../models/api/make-post.js')
	, deletePost = require(__dirname+'/../models/api/delete-post.js')
	, getRecent = require(__dirname+'/../models/api/get-recent.js')
	, getThread = require(__dirname+'/../models/api/get-thread.js')
	, getCatalog = require(__dirname+'/../models/api/get-catalog.js')
	, getBoards = require(__dirname+'/../models/api/get-boards.js');

/*
(async () => {
	await Boards.deleteIncrement('pol');
	await Boards.deleteIncrement('b');
	await Posts.deleteAll('pol');
	await Posts.deleteAll('b');
	await Boards.deleteAll();
	await Boards.insertOne({
		_id: 'pol',
		name: 'Politically Incorrect',
		description: 'Political posts go here.',
	})
	await Boards.insertOne({
		_id: 'b',
		name: 'Random',
		description: 'post anything here',
	})
})();
*/

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

	if (!req.body.message && numFiles === 0) {
		return res.status(400).json({ 'message': 'Must provide a message or file' });
	}
	if (req.body.message && req.body.message.length > 2000) {
		return res.status(400).json({ 'message': 'Message must be 2000 characters or less' });
	}
	if (!req.body.thread && (!req.body.message || req.body.message.length === 0)) {
		return res.status(400).json({ 'message': 'Threads must include a message' });
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

	makePost(req, res, numFiles);

});

// delete a post. using POST isntead of DELETE because of html forms supprot
router.post('/board/:board/delete', Boards.exists, (req, res, next) => {

	if (!req.body.password) {
		return res.status(400).json({ 'message': 'Must provide a password' })
	}
	if (req.body.password.length > 50) {
		return res.status(400).json({ 'message': 'Password must be 50 characters or less' })
	}
	if (!req.body.checked || req.body.checked.length === 0 || req.body.checked.length > 10) { //10 for now just for _some_ limit
		return res.status(400).json({ 'message': 'Must check 1-10 boxes for posts to delete' })
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

