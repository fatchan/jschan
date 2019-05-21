'use strict';

const bcrypt = require('bcrypt')
	, Accounts = require(__dirname+'/../../db/accounts.js');

module.exports = async (req, res, next) => {

	const username = req.body.username.toLowerCase();
	const password = req.body.password;
	const newPassword = req.body.newpassword;

	//fetch an account
	const account = await Accounts.findOne(username);

	//if the account doesnt exist, reject
	if (!account) {
		return res.status(403).render('message', {
			'title': 'Forbidden',
			'message': 'Incorrect username or password',
			'redirect': '/changepassword.html'
		});
	}

	// bcrypt compare input to saved hash
	const passwordMatch = await bcrypt.compare(password, account.passwordHash);

	//if hashes matched
	if (passwordMatch === false) {
		return res.status(403).render('message', {
			'title': 'Forbidden',
			'message': 'Incorrect username or password',
			'redirect': '/changepassword.html'
		});
	}

	//change the password
	await Accounts.changePassword(username, newPassword);
	return res.redirect('/login.html');

}
