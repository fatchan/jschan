'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db/boards.js')
	, Posts = require(__dirname+'/../db/posts.js')
	, Mongo = require(__dirname+'/../db/db.js')
	, { remove } = require('fs-extra')
	, upload = require('express-fileupload')
	, path = require('path')
	, postFiles = upload({
		createParentPath: true,
		safeFileNames: /[^\w-]+/g,
		preserveExtension: 4,
		limits: {
			fileSize: 10 * 1024 * 1024,
			files: 3
		},
		abortOnLimit: true,
		useTempFiles: true,
		tempFileDir: path.join(__dirname+'/../tmp/')
	})
	, bannerFiles = upload({
		createParentPath: true,
		safeFileNames: /[^\w-]+/g,
		preserveExtension: 4,
		limits: {
			fileSize: 10 * 1024 * 1024,
			files: 10
		},
		abortOnLimit: true,
		useTempFiles: true,
		tempFileDir: path.join(__dirname+'/../tmp/')
	})
	, removeBans = require(__dirname+'/../models/forms/removebans.js')
	, makePost = require(__dirname+'/../models/forms/makepost.js')
	, deleteTempFiles = require(__dirname+'/../helpers/files/deletetempfiles.js')
	, uploadBanners = require(__dirname+'/../models/forms/uploadbanners.js')
	, deleteBanners = require(__dirname+'/../models/forms/deletebanners.js')
	, loginAccount = require(__dirname+'/../models/forms/login.js')
	, changePassword = require(__dirname+'/../models/forms/changepassword.js')
	, changeBoardSettings = require(__dirname+'/../models/forms/changeboardsettings.js')
	, registerAccount = require(__dirname+'/../models/forms/register.js')
	, createBoard = require(__dirname+'/../models/forms/create.js')
	, checkPermsMiddleware = require(__dirname+'/../helpers/checks/haspermsmiddleware.js')
	, checkPerms = require(__dirname+'/../helpers/checks/hasperms.js')
	, spamCheck = require(__dirname+'/../helpers/checks/spamcheck.js')
	, paramConverter = require(__dirname+'/../helpers/paramconverter.js')
	, banCheck = require(__dirname+'/../helpers/checks/bancheck.js')
	, verifyCaptcha = require(__dirname+'/../helpers/captcha/captchaverify.js')
	, actionHandler = require(__dirname+'/../models/forms/actionhandler.js')
	, csrf = require(__dirname+'/../helpers/checks/csrfmiddleware.js')
	, actionChecker = require(__dirname+'/../helpers/checks/actionchecker.js');


// login to account
router.post('/login', async (req, res, next) => {

	const errors = [];

	//check exist
	if (!req.body.username || req.body.username.length <= 0) {
		errors.push('Missing username');
	}
	if (!req.body.password || req.body.password.length <= 0) {
		errors.push('Missing password');
	}

	//check too long
	if (req.body.username && req.body.username.length > 50) {
		errors.push('Username must be 50 characters or less');
	}
	if (req.body.password && req.body.password.length > 100) {
		errors.push('Password must be 100 characters or less');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/login.html'
		})
	}

	try {
		await loginAccount(req, res, next);
	} catch (err) {
		return next(err);
	}

});

//change password
router.post('/changepassword', verifyCaptcha, async (req, res, next) => {

	const errors = [];

	//check exist
	if (!req.body.username || req.body.username.length <= 0) {
		errors.push('Missing username');
	}
	if (!req.body.password || req.body.password.length <= 0) {
		errors.push('Missing password');
	}
	if (!req.body.newpassword || req.body.newpassword.length <= 0) {
		errors.push('Missing new password');
	}
	if (!req.body.newpasswordconfirm || req.body.newpasswordconfirm.length <= 0) {
		errors.push('Missing new password confirmation');
	}

	//check too long
	if (req.body.username && req.body.username.length > 50) {
		errors.push('Username must be 50 characters or less');
	}
	if (req.body.password && req.body.password.length > 100) {
		errors.push('Password must be 100 characters or less');
	}
	if (req.body.newpassword && req.body.newpassword.length > 100) {
		errors.push('Password must be 100 characters or less');
	}
	if (req.body.newpasswordconfirm && req.body.newpasswordconfirm.length > 100) {
		errors.push('Password confirmation must be 100 characters or less');
	}
	if (req.body.newpassword != req.body.newpasswordconfirm) {
		errors.push('New password and password confirmation must match');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/changepassword.html'
		})
	}

	try {
		await changePassword(req, res, next);
	} catch (err) {
		return next(err);
	}

});

//create board
router.post('/create', csrf, verifyCaptcha, (req, res, next) => {

	const errors = [];

	//check exist
	if (!req.body.uri || req.body.uri.length <= 0) {
		errors.push('Missing URI');
	}
	if (!req.body.name || req.body.name.length <= 0) {
		errors.push('Missing name');
	}
	if (!req.body.description || req.body.description.length <= 0) {
		errors.push('Missing description');
	}

	//check exist
	if (req.body.uri && req.body.uri.length > 50) {
		errors.push('URI must be 50 characters or less');
	}
	if (req.body.name && req.body.name.length > 50) {
		errors.push('Name must be 50 characters or less');
	}
	if (req.body.description && req.body.description.length > 50) {
		errors.push('Description must be 50 characters or less');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/create.html'
		})
	}

	createBoard(req, res, next);

});

//register account
router.post('/register', verifyCaptcha, (req, res, next) => {

	const errors = [];

	//check exist
	if (!req.body.username || req.body.username.length <= 0) {
		errors.push('Missing username');
	}
	if (!req.body.password || req.body.password.length <= 0) {
		errors.push('Missing password');
	}
	if (!req.body.passwordconfirm || req.body.passwordconfirm.length <= 0) {
		errors.push('Missing password confirmation');
	}

	//check too long
	if (req.body.username && req.body.username.length > 50) {
		errors.push('Username must be 50 characters or less');
	}
	if (req.body.password && req.body.password.length > 100) {
		errors.push('Password must be 100 characters or less');
	}
	if (req.body.passwordconfirm && req.body.passwordconfirm.length > 100) {
		errors.push('Password confirmation must be 100 characters or less');
	}
	if (req.body.password != req.body.passwordconfirm) {
		errors.push('Password and password confirmation must match');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/register.html'
		})
	}

	registerAccount(req, res, next);

});


// make new post
router.post('/board/:board/post', Boards.exists, banCheck, postFiles, paramConverter, verifyCaptcha, async (req, res, next) => {

	if (req.files && req.files.file) {
		if (Array.isArray(req.files.file)) {
			res.locals.numFiles = req.files.file.filter(file => file.size > 0).length;
		} else {
			res.locals.numFiles = req.files.file.size > 0 ? 1 : 0;
			req.files.file = [req.files.file];
		}
		res.locals.numFiles = Math.min(res.locals.numFiles, res.locals.board.settings.maxFiles)
	}

	const errors = [];

	// even if force file and message are off, the psot must contain one of either.
	if (!req.body.message && res.locals.numFiles === 0) {
		errors.push('Must provide a message or file');
	}

	// ensure OP has file, subject and message acording to board settings
	if (!req.body.thread && res.locals.board.settings.forceOPSubject && (!req.body.subject || req.body.subject.length === 0)) {
		errors.push('Threads must include a subject');
	}
	if (!req.body.thread && (res.locals.board.settings.forceOPFile && res.locals.board.settings.maxFiles !== 0) && res.locals.numFiles === 0) {
		errors.push('Threads must include a file');
	}
	if (!req.body.thread && res.locals.board.settings.forceOPMessage && (!req.body.message || req.body.message.length === 0)) {
		errors.push('Threads must include a message');
	}

	// make sure, min message length <= message length < max length (4k)
	if (req.body.message) {
		if (req.body.message.length > 4000) {
			errors.push('Message must be 4000 characters or less');
		} else if (req.body.message.length < res.locals.board.settings.minMessageLength) {
			errors.push(`Message must be at least ${res.locals.board.settings.minMessageLength} characters long`);
		}
	}

	// subject, email, name, password limited length
	if (req.body.name && req.body.name.length > 50) {
		errors.push('Name must be 50 characters or less');
	}
	if (req.body.subject && req.body.subject.length > 50) {
		errors.push('Subject must be 50 characters or less');
	}
	if (req.body.email && req.body.email.length > 50) {
		errors.push('Email must be 50 characters or less');
	}
	if (req.body.password && req.body.password.length > 50) {
		errors.push('Password must be 50 characters or less');
	}

	if (errors.length > 0) {
		await deleteTempFiles(req).catch(e => console.error);
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}${req.body.thread ? '/thread/' + req.body.thread + '.html' : ''}`
		});
	}

	const flood = await spamCheck(req, res);
	if (flood) {
		deleteTempFiles(req).catch(e => console.error);
		return res.status(429).render('message', {
			'title': 'Flood detected',
			'message': 'Please wait before making another post, or a post similar to another user',
			'redirect': `/${req.params.board}${req.body.thread ? '/thread/' + req.body.thread + '.html' : ''}`
		});
	}

	try {
		await makePost(req, res, next);
	} catch (err) {
		await deleteTempFiles(req).catch(e => console.error);
		return next(err);
	}

});

//board settings
router.post('/board/:board/settings', csrf, Boards.exists, checkPermsMiddleware(2), paramConverter, async (req, res, next) => {

	const errors = [];

	if (req.body.description && (req.body.description.length < 1 || req.body.description.length > 50)) {
		errors.push('Board description must be 1-50 characters');
	}
	if (req.body.announcements && (req.body.announcements.length < 1 || req.body.announcements.length > 2000)) {
		errors.push('Board announcements must be 1-2000 characters');
	}
	if (req.body.name && (req.body.name.length < 1 || req.body.name.length > 50)) {
		errors.push('Board name must be 1-50 characters');
	}
	if (req.body.default_name && (req.body.default_name.length < 1 || req.body.default_name.length > 50)) {
		errors.push('Anon name must be 1-50 characters');
	}
	if (typeof req.body.reply_limit === 'number' && (req.body.reply_limit < 1 || req.body.reply_limit > 1000)) {
		errors.push('Reply Limit must be from 1-1000');
	}
	if (typeof req.body.thread_limit === 'number' && (req.body.thread_limit < 10 || req.body.thread_limit > 250)) {
		errors.push('Threads Limit must be 10-250');
	}
	if (typeof req.body.max_files === 'number' && (req.body.max_files < 0 || req.body.max_files > 3)) {
		errors.push('Max files must be 0-3');
	}
	if (typeof req.body.min_message_length === 'number' && (req.body.min_message_length < 0 || req.body.min_message_length > 4000)) {
		errors.push('Min message length must be 0-4000. 0 is disabled.');
	}
	if (typeof req.body.captcha_mode === 'number' && (req.body.captcha_mode < 0 || req.body.captcha_mode > 2)) {
		errors.push('Invalid captcha mode.');
	}
	if (typeof req.body.captcha_trigger === 'number' && (req.body.captcha_trigger < 0 || req.body.captcha_trigger > 10000)) {
		errors.push('Invalid captcha trigger threshold.');
	}
	if (typeof req.body.captcha_trigger_mode === 'number' && (req.body.captcha_trigger_mode < 0 || req.body.captcha_trigger_mode > 2)) {
		errors.push('Invalid captcha trigger mode.')
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/manage.html`
		})
	}

	try {
		await changeBoardSettings(req, res, next);
	} catch (err) {
		return next(err);
	}

});

//upload banners
router.post('/board/:board/addbanners', bannerFiles, csrf, Boards.exists, checkPermsMiddleware(2), paramConverter, async (req, res, next) => {

	if (req.files && req.files.file) {
		if (Array.isArray(req.files.file)) {
			res.locals.numFiles = req.files.file.filter(file => file.size > 0).length;
		} else {
			res.locals.numFiles = req.files.file.size > 0 ? 1 : 0;
			req.files.file = [req.files.file];
		}
	}

	const errors = [];

	if (res.locals.numFiles === 0) {
		errors.push('Must provide a file');
	}
	if (res.locals.board.banners.length+res.locals.numFiles > 100) {
		errors.push('Number of uploads would exceed 100 banner limit');
	}

	if (errors.length > 0) {
		await deleteTempFiles(req).catch(e => console.error);
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/manage.html`
		})
	}

	try {
		await uploadBanners(req, res, next);
	} catch (err) {
		await deleteTempFiles(req).catch(e => console.error);
		return next(err);
	}

});

//delete banners
router.post('/board/:board/deletebanners', csrf, Boards.exists, checkPermsMiddleware(2), paramConverter, async (req, res, next) => {

	const errors = [];

	if (!req.body.checkedbanners || req.body.checkedbanners.length === 0 || req.body.checkedbanners.length > 10) {
		errors.push('Must select 1-10 banners to delete');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/manage.html`
		})
	}

	for (let i = 0; i < req.body.checkedbanners.length; i++) {
		if (!res.locals.board.banners.includes(req.body.checkedbanners[i])) {
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': 'Invalid banners selected',
				'redirect': `/${req.params.board}/manage.html`
			})
		}
	}

	try {
		await deleteBanners(req, res, next);
	} catch (err) {
		console.error(err);
		return next(err);
	}

});

//actions for a specific board
router.post('/board/:board/actions', Boards.exists, banCheck, paramConverter, verifyCaptcha, boardActionController); //Captcha on regular actions
router.post('/board/:board/modactions', csrf, Boards.exists, checkPermsMiddleware(3), paramConverter, boardActionController); //CSRF for mod actions
async function boardActionController(req, res, next) {

	const errors = [];

	//make sure they checked 1-10 posts
	if (!req.body.checkedposts || req.body.checkedposts.length === 0 || req.body.checkedposts.length > 10) {
		errors.push('Must select 1-10 posts');
	}

	res.locals.actions = actionChecker(req);

	//make sure they selected at least 1 action
	if (!res.locals.actions.anyValid) {
		errors.push('No actions selected');
	}

	//check if they have permission to perform the actions
	res.locals.authLevel = checkPerms(req, res);
	if (res.locals.authLevel >= 4) {
		if (res.locals.authLevel > res.locals.actions.authRequired) {
			errors.push('No permission');
		}
		if (req.body.delete && !res.locals.board.settings.userPostDelete) {
			errors.push('Post deletion is disabled on this board');
		}
		if (req.body.spoiler && !res.locals.board.settings.userPostSpoiler) {
			errors.push('File spoilers are disabled on this board');
		}
		if (req.body.unlink_file && !res.locals.board.settings.userPostUnlink) {
			errors.push('File unlinking is disabled on this board');
		}
	}

	//check that actions are valid
	if (req.body.password && req.body.password.length > 50) {
		errors.push('Password must be 50 characters or less');
	}
	if (req.body.report_reason && req.body.report_reason.length > 50) {
		errors.push('Report must be 50 characters or less');
	}
	if (req.body.ban_reason && req.body.ban_reason.length > 50) {
		errors.push('Ban reason must be 50 characters or less');
	}
	if ((req.body.report || req.body.global_report) && (!req.body.report_reason || req.body.report_reason.length === 0)) {
		errors.push('Reports must have a reason');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/`
		})
	}

	res.locals.posts = await Posts.getPosts(req.params.board, req.body.checkedposts, true);
	if (!res.locals.posts || res.locals.posts.length === 0) {
		return res.status(404).render('message', {
			'title': 'Not found',
			'error': 'Selected posts not found',
			'redirect': `/${req.params.board}/`
		})
	}

	try {
		await actionHandler(req, res, next);
	} catch (err) {
		console.error(err);
		return next(err);
	}

}

//global actions (global manage page)
router.post('/global/actions', csrf, checkPermsMiddleware(1), paramConverter, globalActionController);
async function globalActionController(req, res, next) {

	const errors = [];

	//make sure they checked 1-10 posts
	if (!req.body.globalcheckedposts || req.body.globalcheckedposts.length === 0 || req.body.globalcheckedposts.length > 10) {
		errors.push('Must select 1-10 posts')
	}

	res.locals.actions = actionChecker(req);

	//make sure they have any global actions, and that they only selected global actions
	if (!res.locals.actions.anyGlobal || res.locals.actions.anyValid > res.locals.actions.anyGlobal) {
		errors.push('Invalid actions selected');
	}

	//check that actions are valid
	if (req.body.password && req.body.password.length > 50) {
		errors.push('Password must be 50 characters or less');
	}
	if (req.body.ban_reason && req.body.ban_reason.length > 50) {
		errors.push('Ban reason must be 50 characters or less');
	}

	//return the errors
	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/globalmanage.html'
		})
	}

	//get posts with global ids only
	res.locals.posts = await Posts.globalGetPosts(req.body.globalcheckedposts, true);
	if (!res.locals.posts || res.locals.posts.length === 0) {
		return res.status(404).render('message', {
			'title': 'Not found',
			'errors': 'Selected posts not found',
			'redirect': '/globalmanage.html'
		})
	}

	try {
		await actionHandler(req, res, next);
	} catch (err) {
		console.error(err);
		return next(err);
	}

}

//unban
router.post('/board/:board/unban', csrf, Boards.exists, checkPermsMiddleware(3), paramConverter, async (req, res, next) => {

	//keep this for later in case i add other options to unbans
	const errors = [];

	if (!req.body.checkedbans || req.body.checkedbans.length === 0 || req.body.checkedbans.length > 10) {
		errors.push('Must select 1-10 bans')
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/manage.html`
		});
	}

	const messages = [];
	try {
		messages.push((await removeBans(req, res, next)));
	} catch (err) {
		return next(err);
	}

	return res.render('message', {
		'title': 'Success',
		'messages': messages,
		'redirect': `/${req.params.board}/manage.html`
	});

});

router.post('/global/unban', csrf, checkPermsMiddleware(1), paramConverter, async(req, res, next) => {

	const errors = [];

	if (!req.body.checkedbans || req.body.checkedbans.length === 0 || req.body.checkedbans.length > 10) {
		errors.push('Must select 1-10 bans')
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/globalmanage.html`
		});
	}

	const messages = [];
	try {
		messages.push((await removeBans(req, res, next)));
	} catch (err) {
		return next(err);
	}

	return res.render('message', {
		'title': 'Success',
		'messages': messages,
		'redirect': `/globalmanage.html`
	});

});

router.post('/newcaptcha', async(req, res, next) => {

	res.clearCookie('captchaid');
	return res.redirect('/captcha.html');

});

module.exports = router;

