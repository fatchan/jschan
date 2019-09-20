'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db/boards.js')
	, { globalLimits } = require(__dirname+'/../configs/main.json')
	//middlewares
	, calcPerms = require(__dirname+'/../helpers/checks/calcpermsmiddleware.js')
	, hasPerms = require(__dirname+'/../helpers/checks/haspermsmiddleware.js')
	, paramConverter = require(__dirname+'/../helpers/paramconverter.js')
	, banCheck = require(__dirname+'/../helpers/checks/bancheck.js')
	, isLoggedIn = require(__dirname+'/../helpers/checks/isloggedin.js')
	, verifyCaptcha = require(__dirname+'/../helpers/captcha/captchaverify.js')
	, csrf = require(__dirname+'/../helpers/checks/csrfmiddleware.js')
	, sessionRefresh = require(__dirname+'/../helpers/sessionrefresh.js')
	, upload = require('express-fileupload')
	, postFiles = upload({
		createParentPath: true,
		safeFileNames: /[^\w\s-]+/g,
		preserveExtension: 4,
		limits: {
			fileSize: globalLimits.postFilesSize.max,
			files: globalLimits.postFiles.max
		},
		abortOnLimit: true,
		useTempFiles: true,
		tempFileDir: __dirname+'/../tmp/'
	})
	, bannerFiles = upload({
		createParentPath: true,
		safeFileNames: /[^\w\s-]+/g,
		preserveExtension: 3,
		limits: {
			fileSize: globalLimits.bannerFilesSize.max,
			files: globalLimits.bannerFiles.max
		},
		abortOnLimit: true,
		useTempFiles: true,
		tempFileDir: __dirname+'/../tmp/'
	})
	//controllers
	, deleteBoardController = require(__dirname+'/forms/deleteboard.js')
	, removeBansController = require(__dirname+'/forms/removebans.js')
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
	, createBoardController = require(__dirname+'/forms/create.js')
	, makePostController = require(__dirname+'/forms/makepost.js')
	, newcaptcha = require(__dirname+'/../models/forms/newcaptcha.js')

//make new post
router.post('/board/:board/post', sessionRefresh, Boards.exists, calcPerms, banCheck, postFiles, paramConverter, verifyCaptcha, makePostController);

//post actions
router.post('/board/:board/actions', sessionRefresh, Boards.exists, calcPerms, banCheck, paramConverter, verifyCaptcha, actionController); //public, with captcha
router.post('/board/:board/modactions', sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(3), paramConverter, actionController); //board manage page
router.post('/global/actions', sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(1), paramConverter, globalActionController); //global manage page

//board management forms
router.post('/board/:board/transfer', sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(2), paramConverter, transferController);
router.post('/board/:board/settings', sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(2), paramConverter, boardSettingsController);
router.post('/board/:board/addbanners', sessionRefresh, bannerFiles, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(2), paramConverter, uploadBannersController); //add banners
router.post('/board/:board/deletebanners', sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(2), paramConverter, deleteBannersController); //delete banners
router.post('/board/:board/unban', sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(3), paramConverter, removeBansController); //remove bans
router.post('/board/:board/deleteboard', sessionRefresh, csrf, Boards.exists, calcPerms, banCheck, isLoggedIn, hasPerms(2), deleteBoardController); //delete board

//global management forms
router.post('/global/unban', sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(1), paramConverter, removeBansController); //remove bans
router.post('/global/addnews', sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), addNewsController); //add new newspost
router.post('/global/deletenews', sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), paramConverter, deleteNewsController); //delete news
router.post('/global/editaccounts', sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(0), editAccountsController); //account editing
router.post('/global/deleteboard', sessionRefresh, csrf, calcPerms, isLoggedIn, hasPerms(1), deleteBoardController); //delete board

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

