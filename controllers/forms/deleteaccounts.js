'use strict';

const deleteAccounts = require(__dirname+'/../../models/forms/deleteaccounts.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		allowedArrays: ['checkedaccounts'],
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedaccounts, 1), expected: false, error: 'Must select at least one account' },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': '/globalmanage/accounts.html'
			})
		}

		try {
			await deleteAccounts(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
