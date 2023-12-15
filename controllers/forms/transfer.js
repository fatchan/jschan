'use strict';

const transferBoard = require(__dirname+'/../../models/forms/transferboard.js')
	, { Accounts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { alphaNumericRegex, checkSchema, lengthBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['username'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const errors = await checkSchema([
			{ result: existsBody(req.body.username), expected: true, error: __('Missing new owner username') },
			{ result: lengthBody(req.body.username, 1, 50), expected: false, error: __('New owner username must be 50 characters or less') },
			{ result: (req.body.username === res.locals.board.owner), expected: false, error: __('New owner must be different from current owner') },
			{ result: alphaNumericRegex.test(req.body.username), expected: true, error: __('New owner username must contain a-z 0-9 only') },
			{ result: async () => {
				res.locals.newOwner = await Accounts.findOne(req.body.username.toLowerCase());
				return res.locals.newOwner != null;
			}, expected: true, error: __('Cannot transfer to account that does not exist') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': `/${req.params.board}/manage/settings.html`
			});
		}

		try {
			await transferBoard(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
