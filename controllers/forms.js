'use strict';

const express  = require('express')
	, router = express.Router({ caseSensitive: true })
	, Boards = require(__dirname+'/../db/boards.js')
	, config = require(__dirname+'/../config.js')
//middlewares
	, torPreBypassCheck = require(__dirname+'/../helpers/checks/torprebypass.js')
	, geoAndTor = require(__dirname+'/../helpers/geoip.js')
	, processIp = require(__dirname+'/../helpers/processip.js')
	, calcPerms = require(__dirname+'/../helpers/checks/calcpermsmiddleware.js')
	, hasPerms = require(__dirname+'/../helpers/checks/haspermsmiddleware.js')
	, paramConverter = require(__dirname+'/../helpers/paramconverter.js')
	, numFiles = require(__dirname+'/../helpers/numfiles.js')
	, imageHashes = require(__dirname+'/../helpers/imagehash.js')
	, banCheck = require(__dirname+'/../helpers/checks/bancheck.js')
	, isLoggedIn = require(__dirname+'/../helpers/checks/isloggedin.js')
	, verifyCaptcha = require(__dirname+'/../helpers/captcha/verify.js')
	, csrf = require(__dirname+'/../helpers/checks/csrfmiddleware.js')
	, useSession = require(__dirname+'/../helpers/usesession.js')
	, sessionRefresh = require(__dirname+'/../helpers/sessionrefresh.js')
	, dnsblCheck = require(__dirname+'/../helpers/checks/dnsbl.js')
	, blockBypassCheck = require(__dirname+'/../helpers/checks/blockbypass.js')
	, fileMiddlewares = require(__dirname+'/../helpers/filemiddlewares.js')
//controllers
	, deleteBoardController = require(__dirname+'/forms/deleteboard.js')
	, editBansController = require(__dirname+'/forms/editbans.js')
	, appealController = require(__dirname+'/forms/appeal.js')
	, globalActionController = require(__dirname+'/forms/globalactions.js')
	, actionController = require(__dirname+'/forms/actions.js')
	, addCustomPageController = require(__dirname+'/forms/addcustompage.js')
	, deleteCustomPageController = require(__dirname+'/forms/deletecustompage.js')
	, addNewsController = require(__dirname+'/forms/addnews.js')
	, editNewsController = require(__dirname+'/forms/editnews.js')
	, deleteNewsController = require(__dirname+'/forms/deletenews.js')
	, uploadBannersController = require(__dirname+'/forms/uploadbanners.js')
	, deleteBannersController = require(__dirname+'/forms/deletebanners.js')
	, addFlagsController = require(__dirname+'/forms/addflags.js')
	, deleteFlagsController = require(__dirname+'/forms/deleteflags.js')
	, boardSettingsController = require(__dirname+'/forms/boardsettings.js')
	, transferController = require(__dirname+'/forms/transfer.js')
	, resignController = require(__dirname+'/forms/resign.js')
	, deleteAccountController = require(__dirname+'/forms/deleteaccount.js')
	, loginController = require(__dirname+'/forms/login.js')
	, registerController = require(__dirname+'/forms/register.js')
	, changePasswordController = require(__dirname+'/forms/changepassword.js')
	, editAccountsController = require(__dirname+'/forms/editaccounts.js')
	, globalSettingsController = require(__dirname+'/forms/globalsettings.js')
	, createBoardController = require(__dirname+'/forms/create.js')
	, makePostController = require(__dirname+'/forms/makepost.js')
	, editPostController = require(__dirname+'/forms/editpost.js')
	, newCaptcha = require(__dirname+'/../models/forms/newcaptcha.js')
	, blockBypass = require(__dirname+'/../models/forms/blockbypass.js')
	, logout = require(__dirname+'/../models/forms/logout.js');

//make new post
router.post('/board/:board/post', geoAndTor, fileMiddlewares.postsEarly, torPreBypassCheck, processIp, useSession, sessionRefresh, Boards.exists, calcPerms, banCheck, fileMiddlewares.posts,
	paramConverter, verifyCaptcha, numFiles, blockBypassCheck, dnsblCheck, imageHashes, makePostController);
router.post('/board/:board/modpost', geoAndTor, fileMiddlewares.postsEarly, torPreBypassCheck, processIp, useSession, sessionRefresh, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(3), fileMiddlewares.posts,
	paramConverter, csrf, numFiles, blockBypassCheck, dnsblCheck, makePostController); //mod post has token instead of captcha

//post actions
router.post('/board/:board/actions', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, Boards.exists, calcPerms, banCheck, paramConverter, verifyCaptcha, actionController); //public, with captcha
router.post('/board/:board/modactions', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(3), paramConverter, actionController); //board manage page
router.post('/global/actions', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(1), paramConverter, globalActionController); //global manage page
//appeal ban
router.post('/appeal', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, paramConverter, verifyCaptcha, appealController);
//edit post
router.post('/editpost', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, csrf, paramConverter, Boards.bodyExists, calcPerms, hasPerms(3), editPostController);

//board management forms
router.post('/board/:board/transfer', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), paramConverter, transferController);
router.post('/board/:board/settings', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), paramConverter, boardSettingsController);
router.post('/board/:board/addbanners', useSession, sessionRefresh, fileMiddlewares.banner, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), paramConverter, numFiles, uploadBannersController); //add banners
router.post('/board/:board/deletebanners', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), paramConverter, deleteBannersController); //delete banners
router.post('/board/:board/addflags', useSession, sessionRefresh, fileMiddlewares.flag, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), paramConverter, numFiles, addFlagsController); //add flags
router.post('/board/:board/deleteflags', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), paramConverter, deleteFlagsController); //delete flags
router.post('/board/:board/addcustompages', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), paramConverter, addCustomPageController); //add banners
router.post('/board/:board/deletecustompages', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), paramConverter, deleteCustomPageController); //delete banners
router.post('/board/:board/editbans', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(3), paramConverter, editBansController); //edit bans
router.post('/board/:board/deleteboard', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(config.get.deleteBoardPermLevel), deleteBoardController); //delete board

//global management forms
router.post('/global/editbans', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(1), paramConverter, editBansController); //remove bans
router.post('/global/deleteboard', useSession, sessionRefresh, csrf, paramConverter, calcPerms, isLoggedIn, hasPerms(Math.min(config.get.deleteBoardPermLevel, 1)), deleteBoardController); //delete board from global management panel
router.post('/global/addnews', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), addNewsController); //add new newspost
router.post('/global/editnews', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), paramConverter, editNewsController); //add new newspost
router.post('/global/deletenews', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), paramConverter, deleteNewsController); //delete news
router.post('/global/editaccounts', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), paramConverter, editAccountsController); //account editing
router.post('/global/settings', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), paramConverter, globalSettingsController); //global settings

//create board
router.post('/create', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, isLoggedIn, verifyCaptcha, calcPerms, createBoardController);
//accounts
router.post('/login', useSession, loginController);
router.post('/logout', useSession, logout);
router.post('/register', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, verifyCaptcha, calcPerms, registerController);
router.post('/changepassword', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, verifyCaptcha, changePasswordController);
router.post('/resign', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, paramConverter, resignController);
router.post('/deleteaccount', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, paramConverter, deleteAccountController);

//removes captcha cookie, for refreshing for noscript users
router.post('/newcaptcha', newCaptcha);
//solve captcha for block bypass
router.post('/blockbypass', geoAndTor, processIp, verifyCaptcha, blockBypass);

module.exports = router;

