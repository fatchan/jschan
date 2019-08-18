'use strict';

const alphaNumericRegex = require(__dirname+'/../../helpers/checks/alphanumregex.js')
	, registerAccount = require(__dirname+'/../../models/forms/register.js');

module.exports = async (req, res, next) => {

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

	//check
	if (req.body.username) {
		if (req.body.username.length > 50) {
			errors.push('Username must be 50 characters or less');
		}
		if (alphaNumericRegex.test(req.body.username) !== true) {
			errors.push('Username must contain a-z 0-9 only');
		}
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

	try {
		await registerAccount(req, res, next);
	} catch (err) {
		return next(err);
	}

}
