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

		const errors = [];

		if (!req.body.checkedaccounts || req.body.checkedaccounts.length === 0) {
			errors.push('Must select at least one account');
		}
		if (typeof req.body.auth_level !== 'number' && !req.body.delete_account) {
			errors.push('Missing auth level or delete action');
		}
		if (typeof req.body.auth_level === 'number' && req.body.auth_level < 0 || req.body.auth_level > 4) {
			errors.push('Auth level must be 0-4');
		}

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
