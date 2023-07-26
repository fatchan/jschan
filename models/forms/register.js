'use strict';

const { Accounts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, roleManager = require(__dirname+'/../../lib/permission/rolemanager.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;
	let original, username, password;
	if (res.locals.isWeb3) {
		original = req.body.address;
		username = req.body.address.toLowerCase();
		password = null;
	} else {
		original = req.body.username;
		username = original.toLowerCase(); //lowercase to prevent duplicates with mixed case
		password = req.body.password;
	}

	const account = await Accounts.findOne(username);

	// if the account exists reject
	if (account != null) {
		return dynamicResponse(req, res, 409, 'message', {
			'title': __('Conflict'),
			'message': __('Account with that username already exists'),
			'redirect': '/register.html'
		});
	}

	await Accounts.insertOne(original, username, password, roleManager.roles.ANON, res.locals.isWeb3);

	if (res.locals.isWeb3) {
		req.session.user = username;
		await Accounts.updateLastActiveDate(username);
		let goto = req.body.goto;
		if (goto == null || !/^\/[0-9a-zA-Z][0-9a-zA-Z._/-]*$/.test(goto)) {
			goto = '/account.html';
		}
		return res.redirect(goto);
	}

	return res.redirect('/login.html');

};
