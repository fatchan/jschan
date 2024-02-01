'use strict';

const editFilter = require(__dirname+'/../../models/forms/editfilter.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		timeFields: ['filter_ban_duration'],
		trimFields: ['filters', 'filter_message'],
		numberFields: ['filter_mode'],
		objectIdFields: ['filter_id'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const errors = await checkSchema([
			{ result: existsBody(req.body.filter_id), expected: true, error: __('Missing filter id') },
			{ result: lengthBody(req.body.filters, 0, 50000), expected: false, error: __('Filter text cannot exceed 50000 characters') },
			{ result: numberBody(req.body.filter_mode, 0, 3), expected: true, error: __('Filter mode must be a number from 0-3') },
			{ result: numberBody(req.body.filter_ban_duration), expected: true, error: __('Invalid filter auto ban duration') },
			{ result: lengthBody(req.body.replace_text, 0, 500), expected: false, error: __('Replace text cannot exceed 500 characters') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': req.headers.referer || (req.params.board ? `/${req.params.board}/manage/filters.html` : '/globalmanage/filters.html')
			});
		}

		try {
			await editFilter(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
