'use strict';

const bcrypt = require('bcrypt')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, redis = require(__dirname+'/../../redis.js')
	, { Accounts } = require(__dirname+'/../../db/');

module.exports = async (req, res, next) => {

	const username = req.body.username.toLowerCase();
	const password = req.body.password;
	const newPassword = req.body.newpassword;

	//fetch an account
	const account = await Accounts.findOne(username);

	//if the account doesnt exist, reject
	if (!account) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Incorrect username or password',
			'redirect': '/changepassword.html'
		});
	}

	// bcrypt compare input to saved hash
	const passwordMatch = await bcrypt.compare(password, account.passwordHash);

	//if hashes matched
	if (passwordMatch === false) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Incorrect username or password',
			'redirect': '/changepassword.html'
		});
	}

	//change the password
	await Promise.all([
		Accounts.changePassword(username, newPassword),
		redis.deletePattern(`sess:*:${username}`),
	]);

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Changed password',
		'redirect': '/login.html'
	});

}
