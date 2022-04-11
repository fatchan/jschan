'use strict';

const express  = require('express')
	, router = express.Router({ caseSensitive: true })
	, Boards = require(__dirname+'/../db/boards.js')
	, config = require(__dirname+'/../lib/misc/config.js')
//middlewares
	, torPreBypassCheck = require(__dirname+'/../lib/middleware/captcha/torprebypass.js')
	, geoAndTor = require(__dirname+'/../lib/middleware/ip/geoip.js')
	, processIp = require(__dirname+'/../lib/middleware/ip/processip.js')
	, calcPerms = require(__dirname+'/../lib/middleware/permission/calcpermsmiddleware.js')
	, Permissions = require(__dirname+'/../lib/permission/permissions.js')
	, hasPerms = require(__dirname+'/../lib/middleware/permission/haspermsmiddleware.js')
	, numFiles = require(__dirname+'/../lib/middleware/file/numfiles.js')
	, imageHashes = require(__dirname+'/../lib/middleware/file/imagehash.js')
	, banCheck = require(__dirname+'/../lib/middleware/permission/bancheck.js')
	, isLoggedIn = require(__dirname+'/../lib/middleware/permission/isloggedin.js')
	, verifyCaptcha = require(__dirname+'/../lib/middleware/captcha/verify.js')
	, csrf = require(__dirname+'/../lib/middleware/misc/csrfmiddleware.js')
	, useSession = require(__dirname+'/../lib/middleware/permission/usesession.js')
	, sessionRefresh = require(__dirname+'/../lib/middleware/permission/sessionrefresh.js')
	, dnsblCheck = require(__dirname+'/../lib/middleware/ip/dnsbl.js')
	, blockBypass = require(__dirname+'/../lib/middleware/captcha/blockbypass.js')
	, fileMiddlewares = require(__dirname+'/../lib/middleware/file/filemiddlewares.js')
//controllers
	, { deleteBoardController, editBansController, appealController, globalActionController,
		actionController, addCustomPageController, deleteCustomPageController, addNewsController,
		editNewsController, deleteNewsController, uploadBannersController, deleteBannersController, addFlagsController,
		deleteFlagsController, boardSettingsController, transferController, addAssetsController, deleteAssetsController,
		resignController, deleteAccountController, loginController, registerController, changePasswordController,
		deleteAccountsController, editAccountController, globalSettingsController, createBoardController, makePostController,
		addStaffController, deleteStaffController, editStaffController, editCustomPageController, editPostController,
		editRoleController, newCaptchaForm, blockBypassForm, logoutForm, deleteSessionsController } = require(__dirname+'/forms/index.js');


//make new post
router.post('/board/:board/post', geoAndTor, fileMiddlewares.postsEarly, torPreBypassCheck, processIp, useSession, sessionRefresh, Boards.exists, calcPerms, banCheck, fileMiddlewares.posts,
makePostController.paramConverter, verifyCaptcha, numFiles, blockBypass.middleware, dnsblCheck, imageHashes, makePostController.controller);
router.post('/board/:board/modpost', geoAndTor, fileMiddlewares.postsEarly, torPreBypassCheck, processIp, useSession, sessionRefresh, Boards.exists, calcPerms, banCheck, isLoggedIn,
hasPerms.one(Permissions.MANAGE_BOARD_GENERAL), fileMiddlewares.posts, makePostController.paramConverter, csrf, numFiles, blockBypass.middleware, dnsblCheck, makePostController.controller); //mod post has token instead of captcha

//post actions
router.post('/board/:board/actions', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, Boards.exists, calcPerms, banCheck, actionController.paramConverter, verifyCaptcha, actionController.controller); //public, with captcha
router.post('/board/:board/modactions', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn,
hasPerms.one(Permissions.MANAGE_BOARD_GENERAL), actionController.paramConverter, actionController.controller); //board manage page

router.post('/global/actions', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, csrf, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_GLOBAL_GENERAL), globalActionController.paramConverter, globalActionController.controller); //global manage page

//appeal ban
router.post('/appeal', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, appealController.paramConverter, verifyCaptcha, appealController.controller);
//edit post
router.post('/editpost', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, csrf, editPostController.paramConverter, Boards.bodyExists, calcPerms,
hasPerms.any(Permissions.MANAGE_GLOBAL_GENERAL, Permissions.MANAGE_BOARD_GENERAL), editPostController.controller);

//board management forms
router.post('/board/:board/transfer', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn,
hasPerms.any(Permissions.MANAGE_BOARD_OWNER, Permissions.MANAGE_GLOBAL_BOARDS), transferController.paramConverter, transferController.controller);
router.post('/board/:board/settings', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_BOARD_SETTINGS), boardSettingsController.paramConverter, boardSettingsController.controller);
router.post('/board/:board/editbans', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_BOARD_BANS), editBansController.paramConverter, editBansController.controller); //edit bans
router.post('/board/:board/deleteboard', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn,
hasPerms.any(Permissions.MANAGE_BOARD_OWNER, Permissions.MANAGE_GLOBAL_BOARDS), deleteBoardController.controller); //delete board

//board crud banners, flags, assets, custompages
router.post('/board/:board/addbanners', useSession, sessionRefresh, fileMiddlewares.banner, csrf, Boards.exists, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_BOARD_CUSTOMISATION), numFiles, uploadBannersController.controller); //add banners
router.post('/board/:board/deletebanners', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_BOARD_CUSTOMISATION), deleteBannersController.paramConverter, deleteBannersController.controller); //delete banners
router.post('/board/:board/addassets', useSession, sessionRefresh, fileMiddlewares.asset, csrf, Boards.exists, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_BOARD_CUSTOMISATION), numFiles, addAssetsController.controller); //add assets
router.post('/board/:board/deleteassets', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_BOARD_CUSTOMISATION), deleteAssetsController.paramConverter, deleteAssetsController.controller); //delete assets
router.post('/board/:board/addflags', useSession, sessionRefresh, fileMiddlewares.flag, csrf, Boards.exists, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_BOARD_CUSTOMISATION), numFiles, addFlagsController.controller); //add flags
router.post('/board/:board/deleteflags', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_BOARD_CUSTOMISATION), deleteFlagsController.paramConverter, deleteFlagsController.controller); //delete flags
router.post('/board/:board/addcustompages', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_BOARD_CUSTOMISATION), addCustomPageController.paramConverter, addCustomPageController.controller); //add custom pages
router.post('/board/:board/deletecustompages', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_BOARD_CUSTOMISATION), deleteCustomPageController.paramConverter, deleteCustomPageController.controller); //delete custom pages
router.post('/board/:board/editcustompage', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_BOARD_CUSTOMISATION), editCustomPageController.paramConverter, editCustomPageController.controller); //edit custom page
router.post('/board/:board/addstaff', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_BOARD_STAFF), addStaffController.paramConverter, addStaffController.controller); //add board staff
router.post('/board/:board/editstaff', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_BOARD_STAFF), editStaffController.paramConverter, editStaffController.controller); //edit staff permission
router.post('/board/:board/deletestaff', useSession, sessionRefresh, csrf, Boards.exists, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_BOARD_STAFF), deleteStaffController.paramConverter, deleteStaffController.controller); //delete board staff

//global management forms
router.post('/global/editbans', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_GLOBAL_BANS), editBansController.paramConverter, editBansController.controller); //remove bans
router.post('/global/deleteboard', useSession, sessionRefresh, csrf, deleteBoardController.paramConverter, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_GLOBAL_BOARDS), deleteBoardController.controller); //delete board from global management panel
router.post('/global/addnews', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_GLOBAL_NEWS), addNewsController.paramConverter, addNewsController.controller); //add new newspost
router.post('/global/editnews', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_GLOBAL_NEWS), editNewsController.paramConverter, editNewsController.controller); //add new newspost
router.post('/global/deletenews', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_GLOBAL_NEWS), deleteNewsController.paramConverter, deleteNewsController.controller); //delete news
router.post('/global/deleteaccounts', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_GLOBAL_ACCOUNTS), deleteAccountsController.paramConverter, deleteAccountsController.controller); //account deleting
router.post('/global/editaccount', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_GLOBAL_ACCOUNTS), editAccountController.paramConverter, editAccountController.controller); //account editing
router.post('/global/editrole', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_GLOBAL_ROLES), editRoleController.paramConverter, editRoleController.controller); //role editing
router.post('/global/settings', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn,
hasPerms.one(Permissions.MANAGE_GLOBAL_SETTINGS), globalSettingsController.paramConverter, globalSettingsController.controller); //global settings

//create board
router.post('/create', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, isLoggedIn, verifyCaptcha, calcPerms, createBoardController.paramConverter, createBoardController.controller);

//accounts
router.post('/login', useSession, loginController.paramConverter, loginController.controller);
router.post('/logout', useSession, logoutForm);
router.post('/register', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, verifyCaptcha, calcPerms, registerController.paramConverter, registerController.controller);
router.post('/changepassword', geoAndTor, torPreBypassCheck, processIp, useSession, sessionRefresh, verifyCaptcha, changePasswordController.paramConverter, changePasswordController.controller);
router.post('/resign', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, resignController.paramConverter, resignController.controller);
router.post('/deleteaccount', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, deleteAccountController.controller);
router.post('/deletesessions', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, deleteSessionsController.paramConverter, deleteSessionsController.controller);

//removes captcha cookie, for refreshing for noscript users
router.post('/newcaptcha', newCaptchaForm);
//solve captcha for block bypass
router.post('/blockbypass', geoAndTor, processIp, verifyCaptcha, blockBypassForm);

module.exports = router;

