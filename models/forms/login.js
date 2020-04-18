'use strict';

const bcrypt = require('bcrypt')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { Accounts } = require(__dirname+'/../../db/');

module.exports = async (req, res, next) => {

	const username = req.body.username.toLowerCase();
	const password = req.body.password;
	const goto = req.body.goto || '/account.html';
	const failRedirect = `/login.html${goto ? '?goto='+goto : ''}`

	//fetch an account
	const account = await Accounts.findOne(username);

	//if the account doesnt exist, reject
	if (!account) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Incorrect username or password',
			'redirect': failRedirect
		});
	}

	// bcrypt compare input to saved hash
	const passwordMatch = await bcrypt.compare(password, account.passwordHash);

	//if hashes matched
	if (passwordMatch === true) {

		// add the account to the session and authenticate if password was correct
		req.session.user = {
			'username': account._id,
			'authLevel': account.authLevel,
			'ownedBoards': account.ownedBoards,
			'modBoards': account.modBoards,
		};
		req.session.authenticated = true;

		//successful login
		return res.redirect(goto);

	}

	return dynamicResponse(req, res, 403, 'message', {
		'title': 'Forbidden',
		'message': 'Incorrect username or password',
		'redirect': failRedirect
	});

}
