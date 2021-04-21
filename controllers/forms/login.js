'use strict';

const loginAccount = require(__dirname+'/../../models/forms/login.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['username', 'password'],
	}),

	controller: async (req, res, next) => {
		const schema = [
			{ result: existsBody(req.body.username), expected: true, error: 'Missing username' },
			{ result: existsBody(req.body.password), expected: true, error: 'Missing password' },
			{ result: lengthBody(req.body.username, 1, 50), expected: false, error: 'Username must be 50 characters or less' },
			{ result: lengthBody(req.body.password, 1, 100), expected: false, error: 'Password must be 100 characters or less' },
		];
		const errors = await checkSchema(schema);
		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': '/login.html'
			})
		}
		try {
			await loginAccount(req, res, next);
		} catch (err) {
			return next(err);
		}
	},

}
