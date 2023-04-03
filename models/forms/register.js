'use strict';

const { Accounts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, roleManager = require(__dirname+'/../../lib/permission/rolemanager.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;
	const original = req.body.username; //stored but not used yet
	const username = original.toLowerCase(); //lowercase to prevent duplicates with mixed case
	const password = req.body.password;

	const account = await Accounts.findOne(username);

	// if the account exists reject
	if (account != null) {
		return dynamicResponse(req, res, 409, 'message', {
			'title': __('Conflict'),
			'message': __('Account with that username already exists'),
			'redirect': '/register.html'
		});
	}

	// add account to db. password is hashed in db model func for easier tests
	await Accounts.insertOne(original, username, password, roleManager.roles.ANON);

	return res.redirect('/login.html');

};
