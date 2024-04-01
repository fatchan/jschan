'use strict';

const deleteAccounts = require(__dirname+'/../../models/forms/deleteaccounts.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { Permissions } = require(__dirname+'/../../lib/permission/permissions.js')
	, { existsBody, checkSchema, lengthBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		allowedArrays: ['checkedaccounts', 'delete_owned_boards'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedaccounts, 1), expected: false, error: __('Must select at least one account') },
			{ result: !existsBody(req.body.delete_owned_boards) || res.locals.permissions.get(Permissions.GLOBAL_MANAGE_BOARDS), expected: true, error: __('No permission') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': '/globalmanage/accounts.html'
			});
		}

		try {
			await deleteAccounts(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
