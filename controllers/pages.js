'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db/boards.js')
	, Posts = require(__dirname+'/../db/posts.js')
	, { captchaOptions } = require(__dirname+'/../configs/main.js')
	//middlewares
	, processIp = require(__dirname+'/../helpers/processip.js')
	, geoAndTor = require(__dirname+'/../helpers/geoip.js')
	, calcPerms = require(__dirname+'/../helpers/checks/calcpermsmiddleware.js')
	, hasPerms = require(__dirname+'/../helpers/checks/haspermsmiddleware.js')
	, isLoggedIn = require(__dirname+'/../helpers/checks/isloggedin.js')
	, paramConverter = require(__dirname+'/../helpers/paramconverter.js')
	, useSession = require(__dirname+'/../helpers/usesession.js')
	, sessionRefresh = require(__dirname+'/../helpers/sessionrefresh.js')
	, csrf = require(__dirname+'/../helpers/checks/csrfmiddleware.js')
	, setMinimal = require(__dirname+'/../helpers/setminimal.js')
	//page models
	, { manageRecent, manageReports, manageBanners, manageSettings, manageBans,
		manageBoard, manageThread, manageLogs, manageCatalog } = require(__dirname+'/../models/pages/manage/')
	, { globalManageSettings, globalManageReports, globalManageBans,
		globalManageRecent, globalManageAccounts, globalManageNews, globalManageLogs } = require(__dirname+'/../models/pages/globalmanage/')
	, { changePassword, blockBypass, home, register, login, create,
		board, catalog, banners, randombanner, news, captchaPage, overboard,
		captcha, thread, modlog, modloglist, account, boardlist } = require(__dirname+'/../models/pages/');

//homepage
router.get('/index.html', home);

//news page
router.get('/news.html', news);

//board list
router.get('/boards.html', useSession, sessionRefresh, calcPerms, boardlist);

//board pages
router.get('/:board/:page(1[0-9]{1,}|[2-9][0-9]{0,}|index).html', Boards.exists, paramConverter, board); //index
router.get('/:board/thread/:id([1-9][0-9]{0,}).html', Boards.exists, paramConverter, Posts.exists, thread); //thread view
router.get('/:board/catalog.html', Boards.exists, catalog); //catalog
router.get('/:board/logs.html', Boards.exists, modloglist);//modlog list
router.get('/:board/logs/:date(\\d{2}-\\d{2}-\\d{4}).html', Boards.exists, paramConverter, modlog); //daily log
router.get('/:board/banners.html', Boards.exists, banners); //banners
router.get('/all.html', overboard); //overboard
router.get('/create.html', useSession, sessionRefresh, isLoggedIn, create); //create new board
router.get('/randombanner', randombanner); //random banner

//board manage pages
router.get('/:board/manage/reports.html', useSession, sessionRefresh, isLoggedIn, Boards.exists, calcPerms, hasPerms(3), csrf, manageReports);
router.get('/:board/manage/recent.html', useSession, sessionRefresh, isLoggedIn, Boards.exists, calcPerms, hasPerms(3), csrf, manageRecent);
router.get('/:board/manage/bans.html', useSession, sessionRefresh, isLoggedIn, Boards.exists, calcPerms, hasPerms(3), csrf, manageBans);
router.get('/:board/manage/logs.html', useSession, sessionRefresh, isLoggedIn, Boards.exists, calcPerms, hasPerms(3), csrf, manageLogs);
router.get('/:board/manage/settings.html', useSession, sessionRefresh, isLoggedIn, Boards.exists, calcPerms, hasPerms(2), csrf, manageSettings);
router.get('/:board/manage/banners.html', useSession, sessionRefresh, isLoggedIn, Boards.exists, calcPerms, hasPerms(2), csrf, manageBanners);
// if (mod view enabled) {
router.get('/:board/manage/catalog.html', useSession, sessionRefresh, isLoggedIn, Boards.exists, calcPerms, hasPerms(3), csrf, manageCatalog);
router.get('/:board/manage/:page(1[0-9]{1,}|[2-9][0-9]{0,}|index).html', useSession, sessionRefresh, isLoggedIn, Boards.exists, paramConverter, calcPerms, hasPerms(3), csrf, manageBoard);
router.get('/:board/manage/thread/:id([1-9][0-9]{0,}).html', useSession, sessionRefresh, isLoggedIn, Boards.exists, paramConverter, calcPerms, hasPerms(3), csrf, Posts.exists, manageThread);

//global manage pages
router.get('/globalmanage/reports.html', useSession, sessionRefresh, isLoggedIn, calcPerms, hasPerms(1), csrf, globalManageReports);
router.get('/globalmanage/bans.html', useSession, sessionRefresh, isLoggedIn, calcPerms, hasPerms(1), csrf, globalManageBans);
router.get('/globalmanage/recent.html', useSession, sessionRefresh, isLoggedIn, calcPerms, hasPerms(1), csrf, globalManageRecent);
router.get('/globalmanage/globallogs.html', useSession, sessionRefresh, isLoggedIn, calcPerms, hasPerms(1), csrf, globalManageLogs);
router.get('/globalmanage/news.html', useSession, sessionRefresh, isLoggedIn, calcPerms, hasPerms(0), csrf, globalManageNews);
router.get('/globalmanage/accounts.html', useSession, sessionRefresh, isLoggedIn, calcPerms, hasPerms(0), csrf, globalManageAccounts);
router.get('/globalmanage/settings.html', useSession, sessionRefresh, isLoggedIn, calcPerms, hasPerms(0), csrf, globalManageSettings);

//captcha
if (captchaOptions.type !== 'google') {
	router.get('/captcha', geoAndTor, processIp, captcha); //get captcha image and cookie
}
router.get('/captcha.html', captchaPage); //iframed for noscript users
router.get('/bypass.html', blockBypass); //block bypass page
router.get('/bypass_minimal.html', setMinimal, blockBypass); //block bypass page

//accounts
router.get('/account.html', useSession, sessionRefresh, isLoggedIn, account); //page showing boards you are mod/owner of, links to password rese, logout, etc
router.get('/login.html', login);
router.get('/register.html', register);
router.get('/changepassword.html', changePassword);

module.exports = router;
