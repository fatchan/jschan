'use strict';

const verifyTwofactor = require(__dirname+'/../../models/forms/twofactor.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['twofactor'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const errors = await checkSchema([
			{ result: res.locals.user.twofactor === false, expected: true, error: __('You already have 2FA setup') },
			{ result: existsBody(req.body.twofactor), expected: true, error: __('Missing 2FA code') },
			{ result: lengthBody(req.body.twofactor, 6, 6), expected: false, error: __('2FA code must be 6 characters') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': '/twofactor.html'
			});
		}

		try {
			await verifyTwofactor(req, res, next);
		} catch (err) {
			return next(err);
		}

	},

};
