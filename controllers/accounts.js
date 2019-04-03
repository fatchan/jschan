
'use strict';

const express  = require('express')
	, router = express.Router()
	, loginAccount = require(__dirname+'/../models/accounts/login.js')
	, registerAccount = require(__dirname+'/../models/accounts/register.js');

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

// regisger an account
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

router.get('/logout', (req, res, next) => {

	if (req.session.authenticated === true) {
		req.session.destroy();
		return res.render('message', {
			'title': 'Success',
			'message': 'You have been logged out successfully',
			'redirect': '/'
		});
	}

	return res.status(400).render('message', {
		'title': 'Bad request',
		'message': 'You are not logged in',
		'redirect': '/login'
	})

})

module.exports = router;
