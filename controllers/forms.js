'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db-models/boards.js')
	, Posts = require(__dirname+'/../db-models/posts.js')
	, Trips = require(__dirname+'/../db-models/trips.js')
	, makePost = require(__dirname+'/../models/forms/make-post.js')
	, deletePost = require(__dirname+'/../models/forms/delete-post.js')
	, loginAccount = require(__dirname+'/../models/forms/login.js')
    , registerAccount = require(__dirname+'/../models/forms/register.js')
	, numberConverter = require(__dirname+'/../helpers/number-converter.js');

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
router.post('/board/:board', Boards.exists, numberConverter, (req, res, next) => {

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

// delete post(s)
router.post('/board/:board/delete', Boards.exists, numberConverter, (req, res, next) => {

	const errors = [];

	if (req.body.password && req.body.password.length > 50) {
		errors.push('Password must be 50 characters or less')
	}
	if (!req.body.checked || req.body.checked.length === 0 || req.body.checked.length > 10) { //10 for now just for _some_ limit
		errors.push('Must check 1-10 boxes for posts to delete')
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}`
		})
	}

	deletePost(req, res);

});

module.exports = router;
