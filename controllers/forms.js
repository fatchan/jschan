'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db/boards.js')
	, { globalLimits, debugLogs, safeFileNames } = require(__dirname+'/../configs/main.js')
	//middlewares
	, calcPerms = require(__dirname+'/../helpers/checks/calcpermsmiddleware.js')
	, hasPerms = require(__dirname+'/../helpers/checks/haspermsmiddleware.js')
	, paramConverter = require(__dirname+'/../helpers/paramconverter.js')
	, numFiles = require(__dirname+'/../helpers/numfiles.js')
	, banCheck = require(__dirname+'/../helpers/checks/bancheck.js')
	, isLoggedIn = require(__dirname+'/../helpers/checks/isloggedin.js')
	, verifyCaptcha = require(__dirname+'/../helpers/captcha/captchaverify.js')
	, csrf = require(__dirname+'/../helpers/checks/csrfmiddleware.js')
	, sessionRefresh = require(__dirname+'/../helpers/sessionrefresh.js')
	, dnsblCheck = require(__dirname+'/../helpers/checks/dnsbl.js')
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
		safeFileNames,
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
		safeFileNames,
		preserveExtension: 3,
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
	, newcaptcha = require(__dirname+'/../models/forms/newcaptcha.js')

//make new post
router.post('/board/:board/post', dnsblCheck, sessionRefresh, Boards.exists, calcPerms, banCheck, postFiles, paramConverter, verifyCaptcha, numFiles, makePostController);
//router.post('/board/:board/modpost', dnsblCheck, sessionRefresh, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(3), postFiles, paramConverter, csrf, numFiles, makePostController); //mod post has token instead of captcha

//post actions
router.post('/board/:board/actions', sessionRefresh, Boards.exists, calcPerms, banCheck, paramConverter, verifyCaptcha, actionController); //public, with captcha
router.post('/board/:board/modactions', sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(3), paramConverter, actionController); //board manage page
router.post('/global/actions', sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(1), paramConverter, globalActionController); //global manage page

//board management forms
router.post('/board/:board/transfer', sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(2), paramConverter, transferController);
router.post('/board/:board/settings', sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(2), paramConverter, boardSettingsController);
router.post('/board/:board/addbanners', sessionRefresh, bannerFiles, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(2), paramConverter, numFiles, uploadBannersController); //add banners
router.post('/board/:board/deletebanners', sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(2), paramConverter, deleteBannersController); //delete banners
router.post('/board/:board/editbans', sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(3), paramConverter, editBansController); //edit bans
router.post('/board/:board/deleteboard', sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(2), deleteBoardController); //delete board

//global management forms
router.post('/global/editbans', sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(1), paramConverter, editBansController); //remove bans
router.post('/global/addnews', sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), addNewsController); //add new newspost
router.post('/global/deletenews', sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), paramConverter, deleteNewsController); //delete news
router.post('/global/editaccounts', sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), paramConverter, editAccountsController); //account editing
router.post('/global/settings', sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), paramConverter, globalSettingsController); //global settings

//accounts
router.post('/login', loginController);
router.post('/register', verifyCaptcha, registerController);
router.post('/changepassword', verifyCaptcha, changePasswordController);

//appeal ban
router.post('/appeal', sessionRefresh, paramConverter, verifyCaptcha, appealController);

//create board
router.post('/create', sessionRefresh, isLoggedIn, verifyCaptcha, calcPerms, hasPerms(4), createBoardController);

//removes captcha cookie, for refreshing for noscript users
router.post('/newcaptcha', newcaptcha);

module.exports = router;

