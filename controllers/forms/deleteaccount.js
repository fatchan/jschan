'use strict';

const deleteAccount = require(__dirname+'/../../models/forms/deleteaccount.js')
	, { Accounts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, doTwoFactor = require(__dirname+'/../../lib/misc/dotwofactor.js')
	, { checkSchema, numberBody, existsBody, lengthBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['twofactor'],
	}),

	controller: async (req, res, next) => {

		const { forceActionTwofactor } = config.get;

		const { __ } = res.locals;

		const { staffBoards, ownedBoards } = res.locals.user;

		const errors = await checkSchema([
			{ result: existsBody(req.body.twofactor) ? lengthBody(req.body.twofactor, 0, 6) : false, expected: false, error: __('Invalid 2FA code') },
			{ result: async () => {
				if (res.locals.user.twofactor && forceActionTwofactor) {
					//2fA (TOTP) validation
					try {
						const twofactorSecret = (await Accounts.findOne(req.session.user)).twofactor;
						const delta = await doTwoFactor(res.locals.user.username, twofactorSecret, req.body.twofactor || '');
						if (delta === null) {
							return false;
						}
						return true;
					} catch (err) {
						console.warn(err);
						return false;
					}
				} else {
					return true; //Force twofactor not enabled
				}
			}, expected: true, error: __('Invalid 2FA Code') },
			{ result: existsBody(req.body.confirm), expected: true, error: __('Missing confirmation') },
			{ result: (numberBody(ownedBoards.length, 0, 0) && numberBody(staffBoards.length, 0, 0)), expected: true, error: __('You cannot delete your account while you hold staff position on any board') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': '/account.html',
			});
		}

		try {
			await deleteAccount(res.locals.user.username);
		} catch (err) {
			return next(err);
		}

		return dynamicResponse(req, res, 200, 'message', {
			'title': __('Success'),
			'message': __('Account deleted'),
			'redirect': '/',
		});

	}

};
