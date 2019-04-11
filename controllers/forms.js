'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db-models/boards.js')
	, Posts = require(__dirname+'/../db-models/posts.js')
	, Trips = require(__dirname+'/../db-models/trips.js')
	, Bans = require(__dirname+'/../db-models/bans.js')
	, banPoster = require(__dirname+'/../models/forms/ban-poster.js')
	, makePost = require(__dirname+'/../models/forms/make-post.js')
	, deletePosts = require(__dirname+'/../models/forms/delete-post.js')
	, spoilerPosts = require(__dirname+'/../models/forms/spoiler-post.js')
	, reportPosts = require(__dirname+'/../models/forms/report-post.js')
	, dismissReports = require(__dirname+'/../models/forms/dismiss-report.js')
	, loginAccount = require(__dirname+'/../models/forms/login.js')
	, registerAccount = require(__dirname+'/../models/forms/register.js')
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

	loginAccount(req, res);

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

	registerAccount(req, res);

});

// make new post
router.post('/board/:board', Boards.exists, banCheck, numberConverter, async (req, res, next) => {

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

	makePost(req, res, numFiles);

});

//report, delete, sticky, etc
router.post('/board/:board/posts', Boards.exists, banCheck, numberConverter, async (req, res, next) => {

	const errors = [];

	if (!req.body.checked || req.body.checked.length === 0 || req.body.checked.length > 10) {
		errors.push('Must select 1-10 posts')
	}
	if (req.body.password && req.body.password.length > 50) {
		errors.push('Password must be 50 characters or less');
	}
	if (req.body.reason && req.body.reason.length > 50) {
		errors.push('Report must be 50 characters or less');
	}
	if (!(req.body.report
		|| req.body.delete
		|| req.body.dismiss
		|| req.body.spoiler
		|| req.body.ban
		|| req.body.global_ban)) {
		errors.push('Must select an action')
	}
	if (req.body.report && (!req.body.reason || req.body.reason.length === 0)) {
		errors.push('Reports must have a reason')
	}
	if ((req.body.ban || req.body.global_ban) && (!req.body.reason || req.body.reason.length === 0)) {
		errors.push('Bans must have a reason')
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}`
		})
	}

	const messages = [];
	try {

		//TODO: maybe fetch the posts first instead of checking multiple times with multiple actions

		//global or board ban
		if (req.body.global_ban) {
			messages.push((await banPoster(req, res, null)));
		} else if (req.body.ban) {
			messages.push((await banPoster(req, res, req.params.board)));
		}

		// then if not deleting, we can spoiler and report or dismiss reports
		if (req.body.delete) {
			messages.push((await deletePosts(req, res)));
		} else {
			if (req.body.spoiler) {
				messages.push((await spoilerPosts(req, res)));
			}
			if (req.body.report) {
				messages.push((await reportPosts(req, res)));
			} else if (req.body.dismiss) {
				messages.push((await dismissReports(req, res)));
			}
		}

	} catch (err) {
		if (err.status) {
			return res.status(err.status).render('message', err.message);
		}
		console.error(err);
		return res.status(500).render('error');
	}

	return res.render('message', {
		'title': 'Success',
		'messages': messages,
		'redirect': `/${req.params.board}`
	});

});



module.exports = router;
