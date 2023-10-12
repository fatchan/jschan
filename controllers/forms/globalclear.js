'use strict';

const globalClear = require(__dirname+'/../../models/forms/globalclear.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, inArrayBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['table']
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const errors = await checkSchema([
			{ result: existsBody(req.body.confirm), expected: true, error: __('Missing confirmation') },
			{ result: inArrayBody(req.body.table, ['sessions', 'blockbypass']), expected: true, error: __('Invalid table') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': '/globalmanage/settings.html'
			});
		}

		try {
			await globalClear(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
