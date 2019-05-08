'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db/boards.js')
	, hasPerms = require(__dirname+'/../helpers/haspermsmiddleware.js')
	, isLoggedIn = require(__dirname+'/../helpers/isloggedin.js')
	, paramConverter = require(__dirname+'/../helpers/paramconverter.js')
	, csrf = require(__dirname+'/../helpers/csrfmiddleware.js')
	//page models
	, home = require(__dirname+'/../models/pages/home.js')
	, register = require(__dirname+'/../models/pages/register.js')
	, manage = require(__dirname+'/../models/pages/manage.js')
	, globalManage = require(__dirname+'/../models/pages/globalmanage.js')
	, changePassword = require(__dirname+'/../models/pages/changepassword.js')
	, login = require(__dirname+'/../models/pages/login.js')
	, board = require(__dirname+'/../models/pages/board.js')
	, catalog = require(__dirname+'/../models/pages/catalog.js')
	, banners = require(__dirname+'/../models/pages/banners.js')
	, captcha = require(__dirname+'/../models/pages/captcha.js')
	, thread = require(__dirname+'/../models/pages/thread.js');

//homepage with board list
router.get('/index.html', home);

//login page
router.get('/login.html', login);

//registration page
router.get('/register.html', register);

//change password page
router.get('/changepassword.html', changePassword);

//logout
router.get('/logout', isLoggedIn, (req, res, next) => {

	//remove session
	req.session.destroy();
	return res.redirect('/');

});

// get captcha
router.get('/captcha', captcha);

// random board banner
router.get('/banners', banners);

//board manage page
router.get('/:board/manage.html', Boards.exists, isLoggedIn, hasPerms, csrf, manage);

//board manage page
router.get('/globalmanage.html', isLoggedIn, hasPerms, csrf, globalManage);

// board page/recents
router.get('/:board/:page([2-9]*|index).html', Boards.exists, paramConverter, board);

// thread view page
router.get('/:board/thread/:id(\\d+).html', Boards.exists, paramConverter, thread);

// board catalog page
router.get('/:board/catalog.html', Boards.exists, catalog);

module.exports = router;

