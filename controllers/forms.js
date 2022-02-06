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
	, { deleteBoardController, editBansController, appealController, globalActionController,
		actionController, addCustomPageController, deleteCustomPageController, addNewsController,
		editNewsController, deleteNewsController, uploadBannersController, deleteBannersController, addFlagsController,
		deleteFlagsController, boardSettingsController, transferController, addAssetsController, deleteAssetsController,
		resignController, deleteAccountController, loginController, registerController, changePasswordController,
		editAccountsController, globalSettingsController, createBoardController, makePostController,
		editCustomPageController, editPostController, newCaptcha, blockBypass, logout } = require(__dirname+'/forms/index.js');


//make new post
router.post('/board/:board/post', geoAndTor, fileMiddlewares.postsEarly, torPreBypassCheck, processIp, useSession, sessionRefresh, Boards.exists, calcPerms, banCheck, fileMiddlewares.posts,
	makePostController.paramConverter, verifyCaptcha, numFiles, blockBypassCheck, dnsblCheck, imageHashes, makePostController.controller);
router.post('/board/:board/modpost', geoAndTor, fileMiddlewares.postsEarly, torPreBypassCheck, processIp, useSession, sessionRefresh, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(3), fileMiddlewares.posts,
	makePostController.paramConverter, csrf, numFiles, blockBypassCheck, dnsblCheck, makePostController.controller); //mod post has token instead of captcha

//post actions
router.post('/board/:board/actions', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, Boards.exists, calcPerms, banCheck, actionController.paramConverter, verifyCaptcha, actionController.controller); //public, with captcha
router.post('/board/:board/modactions', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(3), actionController.paramConverter, actionController.controller); //board manage page
router.post('/global/actions', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(1), globalActionController.paramConverter, globalActionController.controller); //global manage page
//appeal ban
router.post('/appeal', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, appealController.paramConverter, verifyCaptcha, appealController.controller);
//edit post
router.post('/editpost', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, csrf, editPostController.paramConverter, Boards.bodyExists, calcPerms, hasPerms(3), editPostController.controller);

//board management forms
router.post('/board/:board/transfer', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), transferController.paramConverter, transferController.controller);
router.post('/board/:board/settings', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), boardSettingsController.paramConverter, boardSettingsController.controller);
router.post('/board/:board/editbans', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(3), editBansController.paramConverter, editBansController.controller); //edit bans
router.post('/board/:board/deleteboard', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(config.get.deleteBoardPermLevel), deleteBoardController.controller); //delete board

//board crud banners, flags, assets, custompages
router.post('/board/:board/addbanners', useSession, sessionRefresh, fileMiddlewares.banner, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), numFiles, uploadBannersController.controller); //add banners
router.post('/board/:board/deletebanners', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), deleteBannersController.paramConverter, deleteBannersController.controller); //delete banners
router.post('/board/:board/addassets', useSession, sessionRefresh, fileMiddlewares.asset, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), numFiles, addAssetsController.controller); //add assets
router.post('/board/:board/deleteassets', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), deleteAssetsController.paramConverter, deleteAssetsController.controller); //delete assets
router.post('/board/:board/addflags', useSession, sessionRefresh, fileMiddlewares.flag, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), numFiles, addFlagsController.controller); //add flags
router.post('/board/:board/deleteflags', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), deleteFlagsController.paramConverter, deleteFlagsController.controller); //delete flags
router.post('/board/:board/addcustompages', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), addCustomPageController.paramConverter, addCustomPageController.controller); //add custom pages
router.post('/board/:board/deletecustompages', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), deleteCustomPageController.paramConverter, deleteCustomPageController.controller); //delete custom pages
router.post('/board/:board/editcustompage', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn, hasPerms(2), editCustomPageController.paramConverter, editCustomPageController.controller); //edit custom page

//global management forms
router.post('/global/editbans', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(1), editBansController.paramConverter, editBansController.controller); //remove bans
router.post('/global/deleteboard', useSession, sessionRefresh, csrf, deleteBoardController.paramConverter, calcPerms, isLoggedIn, hasPerms(Math.min(config.get.deleteBoardPermLevel, 1)), deleteBoardController.controller); //delete board from global management panel
router.post('/global/addnews', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), addNewsController.paramConverter, addNewsController.controller); //add new newspost
router.post('/global/editnews', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), editNewsController.paramConverter, editNewsController.controller); //add new newspost
router.post('/global/deletenews', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), deleteNewsController.paramConverter, deleteNewsController.controller); //delete news
router.post('/global/editaccounts', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), editAccountsController.paramConverter, editAccountsController.controller); //account editing
router.post('/global/settings', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), globalSettingsController.paramConverter, globalSettingsController.controller); //global settings

//create board
router.post('/create', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, isLoggedIn, verifyCaptcha, calcPerms, createBoardController.paramConverter, createBoardController.controller);

//accounts
router.post('/login', useSession, loginController.paramConverter, loginController.controller);
router.post('/logout', useSession, logout);
router.post('/register', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, verifyCaptcha, calcPerms, registerController.paramConverter, registerController.controller);
router.post('/changepassword', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, verifyCaptcha, changePasswordController.paramConverter, changePasswordController.controller);
router.post('/resign', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, resignController.paramConverter, resignController.controller);
router.post('/deleteaccount', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, deleteAccountController.controller);

//removes captcha cookie, for refreshing for noscript users
router.post('/newcaptcha', newCaptcha);
//solve captcha for block bypass
router.post('/blockbypass', geoAndTor, processIp, verifyCaptcha, blockBypass);

module.exports = router;

