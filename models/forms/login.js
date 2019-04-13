'use strict';

const bcrypt = require('bcrypt')
	, Accounts = require(__dirname+'/../../db-models/accounts.js');

module.exports = async (req, res, next) => {

	const username = req.body.username.toLowerCase();
	const password = req.body.password;
	const redirect = req.body.redirect;

	//fetch an account
	let account;
	try {
		account = await Accounts.findOne(username);
	} catch (err) {
		return next(err);
	}

	//if the account doesnt exist, reject
	if (!account) {
		return res.status(403).render('message', {
			'title': 'Forbidden',
			'message': 'Incorrect username or password',
			'redirect': redirect ? `/login?redirect=${redirect}` : '/login'
		});
	}

	// bcrypt compare input to saved hash
	let passwordMatch;
	try {
		passwordMatch = await bcrypt.compare(password, account.passwordHash);
	} catch (err) {
		return next(err);
	}

	//if hashes matched
	if (passwordMatch === true) {

		// add the account to the session and authenticate if password was correct
		req.session.user = {
			'username': account._id,
			'authLevel': account.authLevel
		};
		req.session.authenticated = true;

		//successful login
		return res.redirect(redirect || '/');

	}

	return res.status(403).render('message', {
		'title': 'Forbidden',
		'message': 'Incorrect username or password',
		'redirect': redirect ? `/login?redirect=${redirect}` : '/login'
	});

}
