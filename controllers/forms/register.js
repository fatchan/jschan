'use strict';

const { Permissions } = require(__dirname+'/../../lib/permission/permissions.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, registerAccount = require(__dirname+'/../../models/forms/register.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { alphaNumericRegex, checkSchema, lengthBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['username', 'password', 'passwordconfirm'],
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: res.locals.permissions.get(Permissions.CREATE_ACCOUNT), blocking: true, expected: true, error: 'No permission' },
			{ result: existsBody(req.body.username), expected: true, error: 'Missing username' },
			{ result: lengthBody(req.body.username, 0, 50), expected: false, error: 'Username must be 50 characters or less' },
			{ result: alphaNumericRegex.test(req.body.username), expected: true, error: 'Username must contain a-z 0-9 only'},
			{ result: existsBody(req.body.password), expected: true, error: 'Missing password' },
			{ result: lengthBody(req.body.password, 0, 50), expected: false, error: 'Password must be 50 characters or less' },
			{ result: existsBody(req.body.passwordconfirm), expected: true, error: 'Missing password confirmation' },
			{ result: lengthBody(req.body.passwordconfirm, 0, 100), expected: false, error: 'Password confirmation must be 100 characters or less' },
			{ result: (req.body.password === req.body.passwordconfirm), expected: true, error: 'Password and password confirmation must match' },
		], res.locals.permissions);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
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
