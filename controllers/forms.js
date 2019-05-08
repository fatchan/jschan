'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db/boards.js')
	, Posts = require(__dirname+'/../db/posts.js')
	, Captchas = require(__dirname+'/../db/captchas.js')
	, Trips = require(__dirname+'/../db/trips.js')
	, Bans = require(__dirname+'/../db/bans.js')
	, Mongo = require(__dirname+'/../db/db.js')
	, banPoster = require(__dirname+'/../models/forms/ban-poster.js')
	, removeBans = require(__dirname+'/../models/forms/removebans.js')
	, makePost = require(__dirname+'/../models/forms/make-post.js')
	, uploadBanners = require(__dirname+'/../models/forms/uploadbanners.js')
	, deleteBanners = require(__dirname+'/../models/forms/deletebanners.js')
	, loginAccount = require(__dirname+'/../models/forms/login.js')
	, changePassword = require(__dirname+'/../models/forms/changepassword.js')
	, registerAccount = require(__dirname+'/../models/forms/register.js')
	, checkPermsMiddleware = require(__dirname+'/../helpers/haspermsmiddleware.js')
	, paramConverter = require(__dirname+'/../helpers/paramconverter.js')
	, banCheck = require(__dirname+'/../helpers/bancheck.js')
	, deletePostFiles = require(__dirname+'/../helpers/files/deletepostfiles.js')
	, verifyCaptcha = require(__dirname+'/../helpers/captchaverify.js')
	, actionHandler = require(__dirname+'/../models/forms/actionhandler.js')
	, csrf = require(__dirname+'/../helpers/csrfmiddleware.js')
	, actionChecker = require(__dirname+'/../helpers/actionchecker.js');


// login to account
router.post('/login', (req, res, next) => {

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

	loginAccount(req, res, next);

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
router.post('/board/:board/post', Boards.exists, banCheck, paramConverter, verifyCaptcha, async (req, res, next) => {

	let numFiles = 0;
	if (req.files && req.files.file) {
		if (Array.isArray(req.files.file)) {
			numFiles = req.files.file.filter(file => file.size > 0).length;
		} else {
			numFiles = req.files.file.size > 0 ? 1 : 0;
			req.files.file = [req.files.file];
		}
		numFiles = Math.min(numFiles, res.locals.board.settings.maxFiles)
	}

	const errors = [];

	if (!req.body.message && numFiles === 0) {
		errors.push('Must provide a message or file');
	}
	if (req.body.message && req.body.message.length > 2000) {
		errors.push('Message must be 2000 characters or less');
	}
	if (!req.body.thread && (!req.body.message || req.body.message.length === 0)) {
		errors.push('Threads must include a message');
	}
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
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}${req.body.thread ? '/thread/' + req.body.thread + '.html' : ''}`
		})
	}

	try {
		await makePost(req, res, next, numFiles);
	} catch (err) {
		if (numFiles > 0) {
			const fileNames = req.files.file.map(file => file.filename);
			await deletePostFiles(fileNames).catch(err => console.error);
		}
		return next(err);
	}

});

//board settings
router.post('/board/:board/settings', csrf, Boards.exists, checkPermsMiddleware, paramConverter, async (req, res, next) => {

	const errors = [];

	if (req.body.default_name && req.body.default_name.length > 20) {
		errors.push('Must provide a message or file');
	}
	if (typeof req.body.reply_limit === 'number' && (req.body.reply_limit < 1 || req.body.reply_limit > 1000)) {
		errors.push('Reply Limit must be from 1-1000');
	}
	if (typeof req.body.thread_limit === 'number' && (req.body.thread_limit < 1 || req.body.thread_limit > 250)) {
		errors.push('Threads Limit must be 1-250');
	}
	if (typeof req.body.max_files === 'number' && (req.body.max_files < 1 || req.body.max_files > 3)) {
		errors.push('Max files must be 1-3');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/manage.html`
		})
	}

	return res.status(501).render('message', {
		'title': 'Not implemented',
		'redirect': `/${req.params.board}/manage.html`
	})

});

//upload banners
router.post('/board/:board/addbanners', csrf, Boards.exists, checkPermsMiddleware, paramConverter, async (req, res, next) => {

	let numFiles = 0;
	if (req.files && req.files.file) {
		if (Array.isArray(req.files.file)) {
			numFiles = req.files.file.filter(file => file.size > 0).length;
		} else {
			numFiles = req.files.file.size > 0 ? 1 : 0;
			req.files.file = [req.files.file];
		}
	}

	const errors = [];

	if (numFiles === 0) {
		errors.push('Must provide a file');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/manage.html`
		})
	}

	try {
		await uploadBanners(req, res, next, numFiles);
	} catch (err) {
		console.error(err);
		return next(err);
	}

});

//delete banners
router.post('/board/:board/deletebanners', csrf, Boards.exists, checkPermsMiddleware, paramConverter, async (req, res, next) => {

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

//report/delete/spoiler/ban
router.post('/board/:board/actions', Boards.exists, banCheck, paramConverter, verifyCaptcha, actionHandler); //Captcha on regular actions
router.post('/board/:board/modactions', csrf, Boards.exists, checkPermsMiddleware, paramConverter, actionHandler); //CSRF for mod actions

//unban
router.post('/board/:board/unban', csrf, Boards.exists, checkPermsMiddleware, paramConverter, async (req, res, next) => {

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

router.post('/global/actions', csrf, checkPermsMiddleware, paramConverter, async(req, res, next) => {

	const errors = [];

	//make sure they checked 1-10 posts
	if (!req.body.globalcheckedposts || req.body.globalcheckedposts.length === 0 || req.body.globalcheckedposts.length > 10) {
		errors.push('Must select 1-10 posts')
	}

	const { anyGlobal } = actionChecker(req);

	//make sure they selected at least 1 global action
	if (!anyGlobal) {
		errors.push('Invalid actions selected');
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
	if (req.body.report && (!req.body.report_reason || req.body.report_reason.length === 0)) {
		errors.push('Reports must have a reason')
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
	const posts = await Posts.globalGetPosts(req.body.globalcheckedposts, true);
	if (!posts || posts.length === 0) {
		return res.status(404).render('message', {
			'title': 'Not found',
			'errors': 'Selected posts not found',
			'redirect': '/globalmanage.html'
		})
	}

	//get the ids
	const postMongoIds = posts.map(post => Mongo.ObjectId(post._id));
	const messages = [];
	const combinedQuery = {};
	let aggregateNeeded = false;
	try {
		if (req.body.global_ban) {
			const { message, action, query } = await banPoster(req, res, next, null, posts);
			if (action) {
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		}
		if (req.body.delete_ip_global) {
			const deletePostIps = posts.map(x => x.ip);
			const deleteIpPosts = await Posts.db.find({
				'ip': {
					'$in': deletePostIps
				}
			}).toArray();
			if (deleteIpPosts && deleteIpPosts.length > 0) {
				const { message } = await deletePosts(req, res, next, deleteIpPosts, null);
				messages.push(message);
				aggregateNeeded = true;
			}
		} else if (req.body.delete) {
			const { message } = await deletePosts(req, res, next, posts);
			messages.push(message);
			aggregateNeeded = true;
		} else {
			// if it was getting deleted, we cant do any of these
			if (req.body.delete_file) {
				const { message, action, query } = await deletePostsFiles(posts);
				if (action) {
					aggregateNeeded = true;
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			}
			if (req.body.global_dismiss) {
				const { message, action, query } = dismissGlobalReports(posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			}
		}
		if (Object.keys(combinedQuery).length > 0) {
			await Posts.db.updateMany({
				'_id': {
					'$in': postMongoIds
				}
			}, combinedQuery);
		}
		if (aggregateNeeded) {
			const threadsToUpdate = [...new Set(posts.filter(post => post.thread !== null))];
			//recalculate and set correct aggregation numbers again
			await Promise.all(threadsToUpdate.map(async (post) => {
				const replyCounts = await Posts.getReplyCounts(post.board, post.thread);
				let replyposts = 0;
				let replyfiles = 0;
				if (replyCounts[0]) {
					replyposts = replyCounts[0].replyposts;
					replyfiles = replyCounts[0].replyfiles;
				}
				Posts.setReplyCounts(post.board, post.thread, replyposts, replyfiles);
			}));
		}
	} catch (err) {
		return next(err);
	}

	return res.render('message', {
		'title': 'Success',
		'messages': messages,
		'redirect': '/globalmanage.html'
	});

});

router.post('/global/unban', csrf, checkPermsMiddleware, paramConverter, async(req, res, next) => {

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

module.exports = router;

