'use strict';

const changePassword = require(__dirname+'/../../models/forms/changepassword.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['username', 'password', 'newpassword', 'newpasswordconfirm'],
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: existsBody(req.body.username), expected: true, error: 'Missing username' },
			{ result: lengthBody(req.body.username, 1, 50), expected: false, error: 'Username must be 50 characters or less' },
			{ result: existsBody(req.body.password), expected: true, error: 'Missing password' },
			{ result: lengthBody(req.body.password, 1, 50), expected: false, error: 'Password must be 50 characters or less' },
			{ result: existsBody(req.body.newpassword), expected: true, error: 'Missing new password' },
			{ result: lengthBody(req.body.newpassword, 1, 100), expected: false, error: 'New pasword must be 100 characters or less' },
			{ result: existsBody(req.body.newpasswordconfirm), expected: true, error: 'Missing new password confirmation' },
			{ result: lengthBody(req.body.newpasswordconfirm, 1, 100), expected: false, error: 'New password confirmation must be 100 characters or less' },
			{ result: (req.body.newpassword === req.body.newpasswordconfirm), expected: true, error: 'New password and password confirmation must match' },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': '/changepassword.html'
			})
		}

		try {
			await changePassword(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
