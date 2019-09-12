'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db/boards.js')
	, Posts = require(__dirname+'/../db/posts.js')
	//middlewares
	, calcPerms = require(__dirname+'/../helpers/checks/calcpermsmiddleware.js')
	, hasPerms = require(__dirname+'/../helpers/checks/haspermsmiddleware.js')
	, isLoggedIn = require(__dirname+'/../helpers/checks/isloggedin.js')
	, paramConverter = require(__dirname+'/../helpers/paramconverter.js')
	, sessionRefresh = require(__dirname+'/../helpers/sessionrefresh.js')
	, csrf = require(__dirname+'/../helpers/checks/csrfmiddleware.js')
	//page models
	, home = require(__dirname+'/../models/pages/home.js')
	, register = require(__dirname+'/../models/pages/register.js')
	, { manageReports, manageBanners, manageSettings, manageBans } = require(__dirname+'/../models/pages/manage/')
	, { globalManageReports, globalManageBans, globalManageBoards, globalManageAccounts, globalManageNews } = require(__dirname+'/../models/pages/globalmanage/')
	, changePassword = require(__dirname+'/../models/pages/changepassword.js')
	, login = require(__dirname+'/../models/pages/login.js')
	, logout = require(__dirname+'/../models/pages/logout.js')
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

//homepage
router.get('/index.html', home);

//news page
router.get('/news.html', news);

//board pages
router.get('/:board/:page(1[0-9]*|[2-9]*|index).html', Boards.exists, paramConverter, board); //index
router.get('/:board/thread/:id(\\d+).html', Boards.exists, paramConverter, Posts.exists, thread); //thread view
router.get('/:board/catalog.html', Boards.exists, catalog); //catalog
router.get('/:board/logs.html', Boards.exists, modloglist);//modlog list
router.get('/:board/logs/:date(\\d{2}-\\d{2}-\\d{4}).html', Boards.exists, paramConverter, modlog); //daily log
router.get('/:board/banners.html', Boards.exists, banners); //banners
router.get('/create.html', sessionRefresh, isLoggedIn, create); //create new board
router.get('/randombanner', randombanner); //random banner

//board manage pages
router.get('/:board/manage/reports.html', sessionRefresh, isLoggedIn, Boards.exists, calcPerms, hasPerms(3), csrf, manageReports);
router.get('/:board/manage/bans.html', sessionRefresh, isLoggedIn, Boards.exists, calcPerms, hasPerms(3), csrf, manageBans);
router.get('/:board/manage/settings.html', sessionRefresh, isLoggedIn, Boards.exists, calcPerms, hasPerms(2), csrf, manageSettings);
router.get('/:board/manage/banners.html', sessionRefresh, isLoggedIn, Boards.exists, calcPerms, hasPerms(2), csrf, manageBanners);

//global manage pages
router.get('/globalmanage/reports.html', sessionRefresh, isLoggedIn, calcPerms, hasPerms(1), csrf, globalManageReports);
router.get('/globalmanage/bans.html', sessionRefresh, isLoggedIn, calcPerms, hasPerms(1), csrf, globalManageBans);
router.get('/globalmanage/news.html', sessionRefresh, isLoggedIn, calcPerms, hasPerms(0), csrf, globalManageNews);
router.get('/globalmanage/accounts.html', sessionRefresh, isLoggedIn, calcPerms, hasPerms(1), csrf, globalManageAccounts);
router.get('/globalmanage/boards.html', sessionRefresh, isLoggedIn, calcPerms, hasPerms(1), csrf, globalManageBoards);

//captcha
router.get('/captcha', captcha); //get captcha image and cookie
router.get('/captcha.html', captchaPage); //iframed for noscript users

//accounts
router.get('/login.html', login);
router.get('/register.html', register);
router.get('/changepassword.html', changePassword);
router.get('/logout', logout);

module.exports = router;

