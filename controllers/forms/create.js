'use strict';

const createBoard = require(__dirname+'/../../models/forms/create.js')
	, { Permissions } = require(__dirname+'/../../lib/permission/permissions.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { alphaNumericRegex, checkSchema, lengthBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['name', 'uri', 'description'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const { globalLimits } = config.get;

		const errors = await checkSchema([
			{ result: res.locals.permissions.get(Permissions.CREATE_BOARD), blocking: true, expected: true, error: __('No permission') },
			{ result: existsBody(req.body.uri), expected: true, error: __('Missing URI') },
			{ result: lengthBody(req.body.uri, 0, globalLimits.fieldLength.uri), expected: false, error: __('URI must be %s characters or less', globalLimits.fieldLength.uri) },
			{ result: existsBody(req.body.name), expected: true, error: __('Missing name') },
			{ result: lengthBody(req.body.name, 0, globalLimits.fieldLength.boardname), expected: false, error: __('Name must be %s characters or less', globalLimits.fieldLength.boardname) },
			{ result: alphaNumericRegex.test(req.body.uri), expected: true, error: __('URI must contain a-z 0-9 only') },
			{ result: lengthBody(req.body.name, 0, globalLimits.fieldLength.description), expected: false, error: __('Description must be %s characters or less', globalLimits.fieldLength.description) },
		], res.locals.permissions);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': '/create.html'
			});
		}

		try {
			await createBoard(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
