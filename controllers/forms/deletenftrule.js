'use strict';

const deleteFilter = require(__dirname+'/../../models/forms/deletefilter.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		allowedArrays: ['checkedfilters'],
		objectIdArrays: ['checkedfilters']
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedfilters, 1), expected: false, error: __('Must select at least one filter to delete') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': req.params.board ? `/${req.params.board}/manage/filters.html` : '/globalmanage/filters.html'
			});
		}

		try {
			await deleteFilter(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
