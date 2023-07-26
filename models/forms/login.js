'use strict';

const bcrypt = require('bcrypt')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, { Accounts } = require(__dirname+'/../../db/')
	, doTwoFactor = require(__dirname+'/../../lib/misc/dotwofactor.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;
	let username, password;
	if (res.locals.isWeb3) {
		username = req.body.address.toLowerCase();
		password = null;
	} else {
		username = req.body.username.toLowerCase();
		password = req.body.password;
	}

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
			'title': __('Forbidden'),
			'message': __('Incorrect login credentials'),
			'redirect': failRedirect
		});
	}

	if (!account.web3 || account.passwordHash) {
		// bcrypt compare input to saved hash
		const passwordMatch = await bcrypt.compare(password, account.passwordHash);
		//2fA (TOTP) validation
		const delta = await doTwoFactor(username, account.twofactor, req.body.twofactor || '');
		//if password was correct and 2fa valid (if enabled)
		if (passwordMatch === false
			|| (account.twofactor && delta === null)) {
			return dynamicResponse(req, res, 403, 'message', {
				'title': __('Forbidden'),
				'message': __('Incorrect login credentials'),
				'redirect': failRedirect
			});
		}
	}

	// add the account to the session and authenticate
	req.session.user = account._id;

	//successful login
	await Accounts.updateLastActiveDate(username);
	return res.redirect(goto);

};
