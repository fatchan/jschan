'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db-models/boards.js')
    , home = require(__dirname+'/../models/pages/home.js')
    , register = require(__dirname+'/../models/pages/register.js')
    , login = require(__dirname+'/../models/pages/login.js')
	, board = require(__dirname+'/../models/pages/board.js')
	, thread = require(__dirname+'/../models/pages/thread.js');

//login page
router.get('/login', login);

//register
router.get('/register', register);

//homepage with list of boards
router.get('/', home);

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

module.exports = router;

