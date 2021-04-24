'use strict';

const editAccounts = require(__dirname+'/../../models/forms/editaccounts.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		allowedArrays: ['checkedaccounts'],
		numberFields: ['auth_level'],
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedaccounts, 1), expected: false, error: 'Must select at least one account' },
			{ result: numberBody(req.body.auth_level, 0, 4), expected: true, error: 'Auth level must be a number 0-4' },
			{ result: (typeof req.body.auth_level === 'number' || req.body.delete_account), expected: true, error: 'Missing auth level or delete action' }
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': '/globalmanage/accounts.html'
			})
		}

		try {
			await editAccounts(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
