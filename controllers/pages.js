'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db/boards.js')
	, Posts = require(__dirname+'/../db/posts.js')
	, calcPerms = require(__dirname+'/../helpers/checks/calcpermsmiddleware.js')
	, hasPerms = require(__dirname+'/../helpers/checks/haspermsmiddleware.js')
	, isLoggedIn = require(__dirname+'/../helpers/checks/isloggedin.js')
	, paramConverter = require(__dirname+'/../helpers/paramconverter.js')
	, csrf = require(__dirname+'/../helpers/checks/csrfmiddleware.js')
	//page models
	, home = require(__dirname+'/../models/pages/home.js')
	, register = require(__dirname+'/../models/pages/register.js')
	, manage = require(__dirname+'/../models/pages/manage.js')
	, globalManage = require(__dirname+'/../models/pages/globalmanage.js')
	, changePassword = require(__dirname+'/../models/pages/changepassword.js')
	, login = require(__dirname+'/../models/pages/login.js')
	, create = require(__dirname+'/../models/pages/create.js')
	, board = require(__dirname+'/../models/pages/board.js')
	, catalog = require(__dirname+'/../models/pages/catalog.js')
	, banners = require(__dirname+'/../models/pages/banners.js')
	, randombanner = require(__dirname+'/../models/pages/randombanner.js')
	, news = require(__dirname+'/../models/pages/news.js')
	, captchaPage = require(__dirname+'/../models/pages/captchapage.js')
	, captcha = require(__dirname+'/../models/pages/captcha.js')
	, thread = require(__dirname+'/../models/pages/thread.js')
	, modlog = require(__dirname+'/../models/pages/modlog.js')
	, modloglist = require(__dirname+'/../models/pages/modloglist.js');

//homepage with board list
router.get('/index.html', home);

// board page/recents
router.get('/:board/:page(1[0-9]*|[2-9]*|index).html', Boards.exists, paramConverter, board);

// thread view page
router.get('/:board/thread/:id(\\d+).html', Boards.exists, paramConverter, Posts.exists, thread);

// board catalog page
router.get('/:board/catalog.html', Boards.exists, catalog);

// modlogs
router.get('/:board/logs.html', Boards.exists, modloglist);
router.get('/:board/logs/:date(\\d{2}-\\d{2}-\\d{4}).html', Boards.exists, paramConverter, modlog);

// random board banner
router.get('/randombanner', randombanner);

// get captcha image and cookie
router.get('/captcha', captcha);

//login page
router.get('/login.html', login);

//login page
router.get('/create.html', isLoggedIn, csrf, create);

//registration page
router.get('/register.html', register);

//news page
router.get('/news.html', news);

//captcha page
router.get('/captcha.html', captchaPage);

//change password page
router.get('/changepassword.html', changePassword);

//logout
router.get('/logout', (req, res, next) => {

	//remove session
	req.session.destroy();
	return res.redirect('/');

});

//public board banners page
router.get('/:board/banners.html', Boards.exists, banners);

//board manage page
router.get('/:board/manage.html', isLoggedIn, Boards.exists, calcPerms, hasPerms(3), csrf, manage);

//global manage page
router.get('/globalmanage.html', isLoggedIn, calcPerms, hasPerms(1), csrf, globalManage);

module.exports = router;

