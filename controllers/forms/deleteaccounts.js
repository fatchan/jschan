'use strict';

const deleteAccounts = require(__dirname+'/../../models/forms/deleteaccounts.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { Permissions } = require(__dirname+'/../../lib/permission/permissions.js')
	, { Accounts } = require(__dirname+'/../../db/')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, doTwoFactor = require(__dirname+'/../../lib/misc/dotwofactor.js')
	, { existsBody, checkSchema, lengthBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['twofactor'],
		allowedArrays: ['checkedaccounts', 'delete_owned_boards'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const { forceActionTwofactor } = config.get;

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedaccounts, 1), expected: false, error: __('Must select at least one account') },
			{ result: !existsBody(req.body.delete_owned_boards) || res.locals.permissions.get(Permissions.GLOBAL_MANAGE_BOARDS), expected: true, error: __('No permission') },
			{ result: existsBody(req.body.twofactor) ? lengthBody(req.body.twofactor, 0, 6) : false, expected: false, error: __('Invalid 2FA code') },
			{ result: async () => {
				if (res.locals.user.twofactor && forceActionTwofactor && existsBody(req.body.delete_owned_boards)) {
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
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': '/globalmanage/accounts.html'
			});
		}

		try {
			await deleteAccounts(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
