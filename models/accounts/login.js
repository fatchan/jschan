'use strict';

const bcrypt = require('bcrypt')
	, Accounts = require(__dirname+'/../../db-models/accounts.js');

module.exports = async (req, res) => {

	const username = req.body.username.toLowerCase();
	const password = req.body.password;

	//fetch an account
	let account;
	try {
		account = await Accounts.findOne(username);
	} catch (err) {
		console.error(err);
		return res.status(500).render('error');
	}

	//if the account doesnt exist, reject
	if (!account) {
		return res.status(403).render('message', {
			'title': 'Forbidden',
			'message': 'Incorrect username or password',
			'redirect': '/login'
		});
	}

	// bcrypt compare input to saved hash
	let passwordMatch;
	try {
		passwordMatch = await bcrypt.compare(password, account.passwordHash);
	} catch (err) {
		console.error(err);
		return res.status(500).render('error');
	}

	//if hashes matched
	if (passwordMatch === true) {

		// add the account to the session and authenticate if password was correct
		req.session.user = account;
		req.session.authenticated = true;

		//successful login
		return res.render('message', {
			'title': 'Success',
			'message': `Welcome, ${username}`,
			'redirect': '/'
		});

	}

	return res.status(403).render('message', {
		'title': 'Forbidden',
		'message': 'Incorrect username or password',
		'redirect': '/login'
	});

}
