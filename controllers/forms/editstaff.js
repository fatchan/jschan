'use strict';

const editStaff = require(__dirname+'/../../models/forms/editstaff.js')
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
			{ result: existsBody(req.body.username), expected: true, error: __('Missing username') },
			{ result: lengthBody(req.body.username, 1, 50), expected: false, error: __('Username must be 50 characters or less') },
			{ result: alphaNumericRegex.test(req.body.username), expected: true, error: __('Username must contain a-z 0-9 only') },
			{ result: (res.locals.board.staff[req.body.username] != null), expected: true, error: __('Invalid staff username') },
			{ result: (req.body.username === res.locals.board.owner), expected: false, error: __('You can\'t edit the permissions of the board owner') },
			{ result: (res.locals.user.username === req.body.username), expected: false, error: __('You can\'t edit your own permissions') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': req.headers.referer || `/${req.params.board}/manage/staff.html`,
			});
		}

		try {
			await editStaff(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
