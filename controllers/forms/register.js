'use strict';

const { Permissions } = require(__dirname+'/../../lib/permission/permissions.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, registerAccount = require(__dirname+'/../../models/forms/register.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { alphaNumericRegex, checkSchema, lengthBody, existsBody } = require(__dirname+'/../../lib/input/schema.js')
	, { isAddress: web3UtilsIsAddress } = require('web3-utils');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['username', 'password', 'passwordconfirm', 'nonce', 'signature', 'address'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		let errors = [];

		if (!res.locals.web3Signed) {
			errors = await checkSchema([
				{ result: res.locals.permissions.get(Permissions.CREATE_ACCOUNT), blocking: true, expected: true, error: __('No permission') },
				{ result: existsBody(req.body.username), expected: true, error: __('Missing username') },
				{ result: lengthBody(req.body.username, 0, 50), expected: false, error: __('Username must be 50 characters or less') },
				{ result: lengthBody(req.body.username), expected: false, error: __('Username must be 50 characters or less') },
				{ result: alphaNumericRegex.test(req.body.username), expected: true, error: __('Username must contain a-z 0-9 only') },
				{ result: web3UtilsIsAddress(req.body.username), expected: false, error: __('Username must not be an ethereum address') },
				{ result: existsBody(req.body.password), expected: true, error: __('Missing password') },
				{ result: lengthBody(req.body.password, 0, 50), expected: false, error: __('Password must be 50 characters or less') },
				{ result: existsBody(req.body.passwordconfirm), expected: true, error: __('Missing password confirmation') },
				{ result: lengthBody(req.body.passwordconfirm, 0, 100), expected: false, error: __('Password confirmation must be 100 characters or less') },
				{ result: (req.body.password === req.body.passwordconfirm), expected: true, error: __('Password and password confirmation must match') },
			], res.locals.permissions);
		}

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': '/register.html'
			});
		}

		try {
			await registerAccount(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
