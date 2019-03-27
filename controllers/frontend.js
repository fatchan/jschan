'use strict';

const express  = require('express')
	, router = express.Router()
	, utils = require('../utils.js')
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

// board page/recents
router.get('/:board/:page?', Posts.checkBoard, async (req, res, next) => {

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

// thread view page
router.get('/:board/thread/:thread([a-f\\d]{24})', Posts.checkBoard, async (req, res, next) => {

    //get the recently bumped thread & preview posts
    let thread;
    try {
        thread = await Posts.getThread(req.params.board, req.params.thread);
    } catch (err) {
        return next(err);
    }

	if (!thread) {
		return res.status(404).render('404');
	}

    //render the page
    res.render('thread', {
        csrf: req.csrfToken(),
        board: req.params.board,
        thread: thread
    });

});

module.exports = router;

