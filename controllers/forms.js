'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db/boards.js')
	, { globalLimits, debugLogs, filterFileNames, spaceFileNameReplacement } = require(__dirname+'/../configs/main.js')
	//middlewares
	, processIp = require(__dirname+'/../helpers/processip.js')
	, calcPerms = require(__dirname+'/../helpers/checks/calcpermsmiddleware.js')
	, hasPerms = require(__dirname+'/../helpers/checks/haspermsmiddleware.js')
	, paramConverter = require(__dirname+'/../helpers/paramconverter.js')
	, numFiles = require(__dirname+'/../helpers/numfiles.js')
	, banCheck = require(__dirname+'/../helpers/checks/bancheck.js')
	, isLoggedIn = require(__dirname+'/../helpers/checks/isloggedin.js')
	, verifyCaptcha = require(__dirname+'/../helpers/captcha/captchaverify.js')
	, csrf = require(__dirname+'/../helpers/checks/csrfmiddleware.js')
	, useSession = require(__dirname+'/../helpers/usesession.js')
	, sessionRefresh = require(__dirname+'/../helpers/sessionrefresh.js')
	, dnsblCheck = require(__dirname+'/../helpers/checks/dnsbl.js')
	, blockBypassCheck = require(__dirname+'/../helpers/checks/blockbypass.js')
	, dynamicResponse = require(__dirname+'/../helpers/dynamic.js')
	, uploadLimitFunction = (req, res, next) => {
		return dynamicResponse(req, res, 413, 'message', {
			'title': 'Payload Too Large',
			'message': 'Your upload was too large',
			'redirect': req.headers.referer
		});
	}
	, upload = require('express-fileupload')
	, postFiles = upload({
		debug: debugLogs,
		createParentPath: true,
		safeFileNames: filterFileNames,
		spaceFileNameReplacement,
		preserveExtension: 4,
		limits: {
			totalSize: globalLimits.postFilesSize.max,
			fileSize: globalLimits.postFilesSize.max,
			//files: globalLimits.postFiles.max
		},
		limitHandler: uploadLimitFunction,
		useTempFiles: true,
		tempFileDir: __dirname+'/../tmp/'
	})
	, bannerFiles = upload({
		debug: debugLogs,
		createParentPath: true,
		safeFileNames: filterFileNames,
		spaceFileNameReplacement,
		preserveExtension: 4,
		limits: {
			totalSize: globalLimits.bannerFilesSize.max,
			fileSize: globalLimits.bannerFilesSize.max,
			files: globalLimits.bannerFiles.max
		},
		limitHandler: uploadLimitFunction,
		useTempFiles: true,
		tempFileDir: __dirname+'/../tmp/'
	})
	//controllers
	, deleteBoardController = require(__dirname+'/forms/deleteboard.js')
	, editBansController = require(__dirname+'/forms/editbans.js')
	, appealController = require(__dirname+'/forms/appeal.js')
	, globalActionController = require(__dirname+'/forms/globalactions.js')
	, actionController = require(__dirname+'/forms/actions.js')
	, addBanController = require(__dirname+'/forms/addban.js')
	, addNewsController = require(__dirname+'/forms/addnews.js')
	, deleteNewsController = require(__dirname+'/forms/deletenews.js')
	, uploadBannersController = require(__dirname+'/forms/uploadbanners.js')
	, deleteBannersController = require(__dirname+'/forms/deletebanners.js')
	, boardSettingsController = require(__dirname+'/forms/boardsettings.js')
	, transferController = require(__dirname+'/forms/transfer.js')
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
router.post('/board/:board/post', processIp, useSession, sessionRefresh, Boards.exists, calcPerms, banCheck, postFiles,
	paramConverter, verifyCaptcha, numFiles, blockBypassCheck, dnsblCheck, makePostController);
router.post('/board/:board/modpost', processIp, useSession, sessionRefresh, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(3), postFiles,
	paramConverter, csrf, numFiles, blockBypassCheck, dnsblCheck, makePostController); //mod post has token instead of captcha

//post actions
router.post('/board/:board/actions', processIp, useSession, sessionRefresh, Boards.exists, calcPerms, banCheck, paramConverter, verifyCaptcha, actionController); //public, with captcha
router.post('/board/:board/modactions', processIp, useSession, sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(3), paramConverter, actionController); //board manage page
router.post('/global/actions', processIp, useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(1), paramConverter, globalActionController); //global manage page
//appeal ban
router.post('/appeal', processIp, useSession, sessionRefresh, paramConverter, verifyCaptcha, appealController);
//edit post
router.post('/editpost', processIp, useSession, sessionRefresh, csrf, paramConverter, Boards.bodyExists, calcPerms, hasPerms(3), editPostController);

//board management forms
router.post('/board/:board/transfer', processIp, useSession, sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(2), paramConverter, transferController);
router.post('/board/:board/settings', processIp, useSession, sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(2), paramConverter, boardSettingsController);
router.post('/board/:board/addbanners', processIp, useSession, sessionRefresh, bannerFiles, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(2), paramConverter, numFiles, uploadBannersController); //add banners
router.post('/board/:board/deletebanners', processIp, useSession, sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(2), paramConverter, deleteBannersController); //delete banners
router.post('/board/:board/addban', processIp, useSession, sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(3), paramConverter, addBanController); //add ban manually without post
router.post('/board/:board/editbans', processIp, useSession, sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(3), paramConverter, editBansController); //edit bans
router.post('/board/:board/deleteboard', processIp, useSession, sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(2), deleteBoardController); //delete board

//global management forms
router.post('/global/editbans', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(1), paramConverter, editBansController); //remove bans
router.post('/global/addban', processIp, useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(1), paramConverter, addBanController); //add ban manually without post
router.post('/global/deleteboard', useSession, sessionRefresh, csrf, paramConverter, calcPerms, isLoggedIn, hasPerms(1), deleteBoardController); //delete board
router.post('/global/addnews', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), addNewsController); //add new newspost
router.post('/global/deletenews', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), paramConverter, deleteNewsController); //delete news
router.post('/global/editaccounts', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), paramConverter, editAccountsController); //account editing
router.post('/global/settings', useSession, sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), paramConverter, globalSettingsController); //global settings

//create board
router.post('/create', processIp, useSession, sessionRefresh, isLoggedIn, verifyCaptcha, calcPerms, hasPerms(4), createBoardController);
//accounts
router.post('/login', useSession, loginController);
router.post('/logout', useSession, logout);
router.post('/register', processIp, useSession, sessionRefresh, verifyCaptcha, calcPerms, registerController);
router.post('/changepassword', processIp, useSession, sessionRefresh, verifyCaptcha, changePasswordController);

//removes captcha cookie, for refreshing for noscript users
router.post('/newcaptcha', newCaptcha);
//solve captcha for block bypass
router.post('/blockbypass', processIp, verifyCaptcha, blockBypass);

module.exports = router;

