'use strict';

const alphaNumericRegex = require(__dirname+'/../../helpers/checks/alphanumregex.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, config = require(__dirname+'/../../config.js')
	, registerAccount = require(__dirname+'/../../models/forms/register.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['username', 'password', 'passwordconfirm'],
	}),

	controller: async (req, res, next) => {

		const { enableUserAccountCreation } = config.get;

		const errors = await checkSchema([
			{ result: (enableUserAccountCreation === true), blocking: true, permLevel: 2, expected: true, error: 'Account creation is currently disabled' },
			{ result: existsBody(req.body.username), expected: true, error: 'Missing username' },
			{ result: lengthBody(req.body.username, 1, 50), expected: false, error: 'Username must be 50 characters or less' },
			{ result: alphaNumericRegex.test(req.body.username), expected: true, error: 'Username must contain a-z 0-9 only'},
			{ result: existsBody(req.body.password), expected: true, error: 'Missing password' },
			{ result: lengthBody(req.body.password, 1, 50), expected: false, error: 'Password must be 50 characters or less' },
			{ result: existsBody(req.body.passwordconfirm), expected: true, error: 'Missing password confirmation' },
			{ result: lengthBody(req.body.passwordconfirm, 1, 100), expected: false, error: 'Password confirmation must be 100 characters or less' },
			{ result: (req.body.password === req.body.passwordconfirm), expected: true, error: 'Password and password confirmation must match' },
		], res.locals.permLevel);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': '/register.html'
			})
		}

		try {
			await registerAccount(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
