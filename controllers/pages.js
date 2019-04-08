'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db-models/boards.js')
	, checkAuth = require(__dirname+'/../helpers/check-auth.js')
	, numberConverter = require(__dirname+'/../helpers/number-converter.js')
	//page models
    , home = require(__dirname+'/../models/pages/home.js')
    , register = require(__dirname+'/../models/pages/register.js')
    , manage = require(__dirname+'/../models/pages/manage.js')
    , login = require(__dirname+'/../models/pages/login.js')
	, board = require(__dirname+'/../models/pages/board.js')
	, catalog = require(__dirname+'/../models/pages/catalog.js')
	, thread = require(__dirname+'/../models/pages/thread.js');

//homepage with board list
router.get('/', home);

//login page
router.get('/login', login);

//registration page
router.get('/register', register);

//logout
router.get('/logout', (req, res, next) => {

    if (req.session.authenticated === true) {
        req.session.destroy();
        return res.render('message', {
            'title': 'Success',
            'message': 'You have been logged out successfully',
            'redirect': '/'
        });
    }

    return res.status(400).render('message', {
        'title': 'Bad request',
        'message': 'You are not logged in',
        'redirect': '/login'
    })

});

//board manage page
router.get('/:board/manage', Boards.exists, checkAuth, Boards.canManage, manage);

// board page/recents
router.get('/:board/:page(\\d+)?', Boards.exists, numberConverter, board);

// thread view page
router.get('/:board/thread/:id(\\d+)', Boards.exists, numberConverter, thread);

// board catalog page
router.get('/:board/catalog', Boards.exists, catalog);

module.exports = router;

