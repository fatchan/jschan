'use strict';

const bcrypt = require('bcrypt')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, redis = require(__dirname+'/../../lib/redis/redis.js')
	, doTwoFactor = require(__dirname+'/../../lib/misc/dotwofactor.js')
	, { Accounts } = require(__dirname+'/../../db/');

module.exports = async (req, res) => {

	const username = req.body.username.toLowerCase();
	const password = req.body.password;
	const newPassword = req.body.newpassword;

	//fetch an account
	const account = await Accounts.findOne(username);

	//if the account doesnt exist, reject
	if (!account) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Incorrect account credentials',
			'redirect': '/changepassword.html'
		});
	}

	// bcrypt compare input to saved hash
	const passwordMatch = await bcrypt.compare(password, account.passwordHash);

	//if hashes matched
	if (passwordMatch === false) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Incorrect account credentials',
			'redirect': '/changepassword.html'
		});
	}

	if (account.twofactor) {
		const delta = await doTwoFactor(username, account.twofactor, req.body.twofactor);
		if (delta === null) {
			return dynamicResponse(req, res, 403, 'message', {
				'title': 'Forbidden',
				'message': 'Incorrect account credentials',
				'redirect': '/changepassword.html'
			});
		}
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

};
