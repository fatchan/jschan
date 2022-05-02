'use strict';

const bcrypt = require('bcrypt')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, { Accounts } = require(__dirname+'/../../db/');

module.exports = async (req, res) => {

	const username = req.body.username.toLowerCase();
	const password = req.body.password;
	let goto = req.body.goto;
	// we don't want to redirect the user to random sites
	if (goto == null || !/^\/[0-9a-zA-Z][0-9a-zA-Z._/-]*$/.test(goto)) {
		goto = '/account.html';
	}
	const failRedirect = `/login.html${goto ? '?goto='+encodeURIComponent(goto) : ''}`;

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
		req.session.user = account._id;

		//successful login
		await Accounts.updateLastActiveDate(username);
		return res.redirect(goto);

	}

	return dynamicResponse(req, res, 403, 'message', {
		'title': 'Forbidden',
		'message': 'Incorrect username or password',
		'redirect': failRedirect
	});

};
