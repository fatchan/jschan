'use strict';

const { Accounts, Boards } = require(__dirname+'/../../db/')
	, resignFromBoard = require(__dirname+'/../../models/forms/resign.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, doTwoFactor = require(__dirname+'/../../lib/misc/dotwofactor.js')
	, { alphaNumericRegex, checkSchema, existsBody, lengthBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['board', 'twofactor'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const { forceActionTwofactor } = config.get;

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
			{ result: existsBody(req.body.board), expected: true, error: __('You did not select a board') },
			{ result: alphaNumericRegex.test(req.body.board), expected: true, error: __('URI must contain a-z 0-9 only') },
			{ result: async () => {
				res.locals.board = await Boards.findOne(req.body.board);
				return res.locals.board != null;
			}, expected: true, error: __('Board /%s/ does not exist', req.body.board) },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': '/account.html'
			});
		}

		try {
			await resignFromBoard(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
