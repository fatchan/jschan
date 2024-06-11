'use strict';

const { Accounts, Boards } = require(__dirname+'/../../db/')
	, deleteBoard = require(__dirname+'/../../models/forms/deleteboard.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, doTwoFactor = require(__dirname+'/../../lib/misc/dotwofactor.js')
	, { alphaNumericRegex, checkSchema, existsBody, lengthBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['uri', 'twofactor'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const { forceActionTwofactor } = config.get;

		let board = null;
		const errors = await checkSchema([
			{ result: existsBody(req.body.twofactor) ? lengthBody(req.body.twofactor, 0, 6) : false, expected: false, error: __('Invalid 2FA code') },
			{ result: async () => {
				if (res.locals.usew && forceActionTwofactor) {
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
			{ result: existsBody(req.body.uri), expected: true, error: __('Missing URI') },
			{ result: alphaNumericRegex.test(req.body.uri), blocking: true, expected: true, error: __('URI must contain a-z 0-9 only') },
			{ result: req.params.board == null || (req.params.board === req.body.uri), expected: true, error: __('URI does not match current board') },
			{ result: async () => {
				board = await Boards.findOne(req.body.uri);
				return board != null;
			}, expected: true, error: __('Board /%s/ does not exist', req.body.uri) }
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': req.params.board ? `/${req.params.board}/manage/settings.html` : '/globalmanage/settings.html'
			});
		}

		try {
			await deleteBoard(board._id, board);
		} catch (err) {
			return next(err);
		}

		return dynamicResponse(req, res, 200, 'message', {
			'title': __('Success'),
			'message': __('Board deleted'),
			'redirect': req.params.board ? '/' : '/globalmanage/settings.html'
		});

	}

};
