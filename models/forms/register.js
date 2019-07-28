'use strict';

const bcrypt = require('bcrypt')
	, Accounts = require(__dirname+'/../../db/accounts.js');

module.exports = async (req, res, next) => {

	const username = req.body.username.toLowerCase();
	const password = req.body.password;

	let account;
	try {
		account = await Accounts.findOne(username);
	} catch (err) {
		return next(err);
	}

	// if the account exists reject
	if (account != null) {
		return res.status(409).render('message', {
			'title': 'Conflict',
			'message': 'Account with this username already exists',
			'redirect': '/register.html'
		});
	}

	// add account to db. password is hashed in db model func for easier tests
	try {
		await Accounts.insertOne(username, password, 4);
	} catch (err) {
		return next(err);
	}

	return res.redirect('/login.html')

}
