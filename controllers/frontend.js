'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db-models/boards.js')
    , home = require(__dirname+'/../models/frontend/home.js')
	, board = require(__dirname+'/../models/frontend/board.js')
	, thread = require(__dirname+'/../models/frontend/thread.js');

// board page/recents
router.get('/:board/:page(\\d+)?', Boards.exists, (req, res, next) => {

    const errors = [];

    if (req.params.page && req.params.page <= 0) {
        errors.push('Invalid page.');
    }

    if (errors.length > 0) {
        return res.status(400).render('message', {
            'title': 'Bad request',
            'errors': errors,
            'redirect': `/${req.params.board}`
        });
    }

	board(req, res);

});

// thread view page
router.get('/:board/thread/:id(\\d+)', Boards.exists, thread);

//homepage with list of boards
router.get('/', home);

module.exports = router;

