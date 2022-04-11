'use strict';

const editStaff = require(__dirname+'/../../models/forms/editstaff.js')
	, { Accounts } = require(__dirname+'/../../db/')
	, alphaNumericRegex = require(__dirname+'/../../lib/input/alphanumregex.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, Permissions = require(__dirname+'/../../lib/permission/permissions.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['username'],
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: existsBody(req.body.username), expected: true, error: 'Missing username' },
			{ result: lengthBody(req.body.username, 1, 50), expected: false, error: 'Username must be 50 characters or less' },
			{ result: alphaNumericRegex.test(req.body.username), expected: true, error: 'Username must contain a-z 0-9 only' },
			{ result: (res.locals.board.staff[req.body.username] != null), expected: true, error: 'Invalid staff username' },
			{ result: (req.body.username === res.locals.board.owner), expected: false, error: "You can't edit the permissions of the board owner" },
			{ result: (res.locals.user.username === req.body.username), expected: false, error: "You can't edit your own permissions" },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
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

}
