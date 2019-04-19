'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db/boards.js')
	, Posts = require(__dirname+'/../db/posts.js')
	, Trips = require(__dirname+'/../db/trips.js')
	, Bans = require(__dirname+'/../db/bans.js')
	, banPoster = require(__dirname+'/../models/forms/ban-poster.js')
	, removeBans = require(__dirname+'/../models/forms/removebans.js')
	, makePost = require(__dirname+'/../models/forms/make-post.js')
	, uploadBanners = require(__dirname+'/../models/forms/uploadbanners.js')
	, deleteBanners = require(__dirname+'/../models/forms/deletebanners.js')
	, deletePosts = require(__dirname+'/../models/forms/delete-post.js')
	, spoilerPosts = require(__dirname+'/../models/forms/spoiler-post.js')
	, reportPosts = require(__dirname+'/../models/forms/report-post.js')
	, globalReportPosts = require(__dirname+'/../models/forms/globalreportpost.js')
	, dismissReports = require(__dirname+'/../models/forms/dismiss-report.js')
	, dismissGlobalReports = require(__dirname+'/../models/forms/dismissglobalreport.js')
	, loginAccount = require(__dirname+'/../models/forms/login.js')
	, changePassword = require(__dirname+'/../models/forms/changepassword.js')
	, registerAccount = require(__dirname+'/../models/forms/register.js')
	, hasPerms = require(__dirname+'/../helpers/haspermsmiddleware.js')
	, numberConverter = require(__dirname+'/../helpers/number-converter.js')
	, banCheck = require(__dirname+'/../helpers/bancheck.js');

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
			'redirect': '/login'
		})
	}

	loginAccount(req, res, next);

});

//change password
router.post('/changepassword', async (req, res, next) => {

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
			'redirect': '/changepassword'
		})
	}

	try {
		await changePassword(req, res, next);
	} catch (err) {
		return next(err);
	}

});

//register account
router.post('/register', (req, res, next) => {

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
			'redirect': '/register'
		})
	}

	registerAccount(req, res, next);

});

// make new post
router.post('/board/:board/post', Boards.exists, banCheck, numberConverter, async (req, res, next) => {

	let numFiles = 0;
	if (req.files && req.files.file) {
		if (Array.isArray(req.files.file)) {
			numFiles = req.files.file.length;
		} else {
			numFiles = 1;
			req.files.file = [req.files.file];
		}
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
			'redirect': `/${req.params.board}${req.body.thread ? '/thread/' + req.body.thread : ''}`
		})
	}

	makePost(req, res, next, numFiles);

});

//upload banners
router.post('/board/:board/addbanners', Boards.exists, banCheck, hasPerms, numberConverter, async (req, res, next) => {

	let numFiles = 0;
	if (req.files && req.files.file) {
		if (Array.isArray(req.files.file)) {
			numFiles = req.files.file.length;
		} else {
			numFiles = 1;
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
			'redirect': `/${req.params.board}/manage`
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
router.post('/board/:board/deletebanners', Boards.exists, banCheck, hasPerms, numberConverter, async (req, res, next) => {

	const errors = [];

	if (!req.body.checkedbanners || req.body.checkedbanners.length === 0 || req.body.checkedbanners.length > 10) {
		errors.push('Must select 1-10 banners to delete');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/manage`
		})
	}

	for (let i = 0; i < req.body.checkedbanners.length; i++) {
		if (!res.locals.board.banners.includes(req.body.checkedbanners[i])) {
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': 'Invalid banners selected',
				'redirect': `/${req.params.board}/manage`
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
router.post('/board/:board/actions', Boards.exists, banCheck, numberConverter, async (req, res, next) => {

	const errors = [];

	if (!req.body.checkedposts || req.body.checkedposts.length === 0 || req.body.checkedposts.length > 10) {
		errors.push('Must select 1-10 posts')
	}
	if (req.body.password && req.body.password.length > 50) {
		errors.push('Password must be 50 characters or less');
	}
	if (req.body.report_reason && req.body.report_reason.length > 50) {
		errors.push('Report must be 50 characters or less');
	}
	if (req.body.ban_reason && req.body.ban_reason.length > 50) {
		errors.push('Ban reason must be 50 characters or less');
	}
	if (!(req.body.report
		|| req.body.global_report
		|| req.body.spoiler
		|| req.body.delete
		|| req.body.dismiss
		|| req.body.global_dismiss
		|| req.body.ban
		|| req.body.global_ban)) {
		errors.push('Invalid actions selected')
	}
	if (req.body.report && (!req.body.report_reason || req.body.report_reason.length === 0)) {
		errors.push('Reports must have a reason')
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}`
		})
	}

	const posts = await Posts.getPosts(req.params.board, req.body.checkedposts, true);
	if (!posts || posts.length === 0) {
		return res.status(404).render('message', {
			'title': 'Not found',
			'errors': 'Selected posts not found',
			'redirect': `/${req.params.board}`
		})
	}

	const messages = [];
	try {

		// if getting global banned, board ban doesnt matter
		if (req.body.global_ban) {
			messages.push((await banPoster(req, res, next, null, posts)));
		} else if (req.body.ban) {
			messages.push((await banPoster(req, res, next, req.params.board, posts)));
		}

		//ban before deleting
		if (req.body.delete) {
			messages.push((await deletePosts(req, res, next, posts)));
		} else {
			// if it was getting deleted, we cant do any of these
			if (req.body.spoiler) {
				messages.push((await spoilerPosts(req, res, next, posts)));
			}
			// cannot report and dismiss at same time
			if (req.body.report) {
				messages.push((await reportPosts(req, res, next)));
			} else if (req.body.dismiss) {
				messages.push((await dismissReports(req, res, next)));
			}

			// cannot report and dismiss at same time
			if (req.body.global_report) {
				messages.push((await globalReportPosts(req, res, next, posts)));
			} else if (req.body.global_dismiss) {
				messages.push((await dismissGlobalReports(req, res, next, posts)));
			}
		}

	} catch (err) {
		//something not right
		if (err.status) {
			// return out special error
			return res.status(err.status).render('message', err.message);
		}
		//some other error, use regular error handler
		return next(err);
	}

	return res.render('message', {
		'title': 'Success',
		'messages': messages,
		'redirect': `/${req.params.board}`
	});

});

//unban
router.post('/board/:board/unban', Boards.exists, banCheck, hasPerms, numberConverter, async (req, res, next) => {

	//keep this for later in case i add other options to unbans
	const errors = [];

	if (!req.body.checkedbans || req.body.checkedbans.length === 0 || req.body.checkedbans.length > 10) {
		errors.push('Must select 1-10 bans')
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/manage`
		});
	}

	const messages = [];
	try {
		messages.push((await removeBans(req, res, next)));
	} catch (err) {
		//something not right
		if (err.status) {
			// return out special error
			return res.status(err.status).render('message', err.message);
		}
		//some other error, use regular error handler
		return next(err);
	}

	return res.render('message', {
		'title': 'Success',
		'messages': messages,
		'redirect': `/${req.params.board}/manage`
	});

});

router.post('/global/actions', hasPerms, numberConverter, async(req, res, next) => {

	const errors = [];

	if (!req.body.globalcheckedposts || req.body.globalcheckedposts.length === 0 || req.body.globalcheckedposts.length > 10) {
		errors.push('Must select 1-10 posts')
	}
	if (req.body.ban_reason && req.body.ban_reason.length > 50) {
		errors.push('Ban reason must be 50 characters or less');
	}
	if (!(req.body.spoiler
		|| req.body.delete
		|| req.body.global_dismiss
		|| req.body.global_ban)) {
		errors.push('Invalid actions selected')
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/globalmanage'
		})
	}

	const posts = await Posts.globalGetPosts(req.body.globalcheckedposts, true);
	if (!posts || posts.length === 0) {
		return res.status(404).render('message', {
			'title': 'Not found',
			'errors': 'Selected posts not found',
			'redirect': '/globalmanage'
		})
	}

	const messages = [];
	try {

		if (req.body.global_ban) {
			messages.push((await banPoster(req, res, next, null, posts)));
		}

		//ban before deleting
		if (req.body.delete) {
			messages.push((await deletePosts(req, res, next, posts)));
		} else {
			// if it was getting deleted, we cant do any of these
			if (req.body.spoiler) {
				messages.push((await spoilerPosts(req, res, next, posts)));
			}
			if (req.body.global_dismiss) {
				messages.push((await dismissGlobalReports(req, res, next, posts)));
			}
		}

	} catch (err) {
		//something not right
		if (err.status) {
			// return out special error
			return res.status(err.status).render('message', err.message);
		}
		//some other error, use regular error handler
		return next(err);
	}

	return res.render('message', {
		'title': 'Success',
		'messages': messages,
		'redirect': `/${req.params.board}`
	});

});

router.post('/global/unban', hasPerms, numberConverter, async(req, res, next) => {

	//TODO
	const errors = [];

	if (!req.body.checkedbans || req.body.checkedbans.length === 0 || req.body.checkedbans.length > 10) {
		errors.push('Must select 1-10 bans')
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/globalmanage`
		});
	}

	const messages = [];
	try {
		messages.push((await removeBans(req, res, next)));
	} catch (err) {
		//something not right
		if (err.status) {
			// return out special error
			return res.status(err.status).render('message', err.message);
		}
		//some other error, use regular error handler
		return next(err);
	}

	return res.render('message', {
		'title': 'Success',
		'messages': messages,
		'redirect': `/globalmanage`
	});

});

module.exports = router;

