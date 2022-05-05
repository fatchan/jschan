'use strict';

const editAccount = require(__dirname+'/../../models/forms/editaccount.js')
	, { Accounts } = require(__dirname+'/../../db/')
	, alphaNumericRegex = require(__dirname+'/../../lib/input/alphanumregex.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, roleManager = require(__dirname+'/../../lib/permission/rolemanager.js')
	, { checkSchema, lengthBody, inArrayBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['username'],
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: existsBody(req.body.username), expected: true, error: 'Missing username' },
			{ result: lengthBody(req.body.username, 1, 50), expected: false, error: 'Username must be 50 characters or less' },
			{ result: alphaNumericRegex.test(req.body.username), expected: true, error: 'Username must contain a-z 0-9 only' },
			{ result: async () => {
				res.locals.editingAccount = await Accounts.findOne(req.body.username);
				return res.locals.editingAccount != null;
			}, expected: true, error: 'Invalid account username' },
			{ result: (res.locals.user.username === req.body.username), expected: false, error: 'You can\'t edit your own permissions' },
			{ result: !existsBody(req.body.template) //no template, OR the template is a valid one
				|| inArrayBody(req.body.template, [roleManager.roles.ANON.base64, roleManager.roles.GLOBAL_STAFF.base64,
					roleManager.roles.ADMIN.base64, roleManager.roles.BOARD_STAFF.base64, roleManager.roles.BOARD_OWNER.base64]),
			expected: true, error: 'Invalid template selection' },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': req.headers.referer || `/${req.params.board}/manage/staff.html`,
			});
		}

		try {
			await editAccount(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
