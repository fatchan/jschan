'use strict';

const deleteNews = require(__dirname+'/../../models/forms/deletenews.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		allowedArrays: ['checkednews'],
		objectIdArrays: ['checkednews']
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkednews, 1), expected: false, error: __('Must select at least one newspost to delete') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': '/globalmanage/news.html'
			});
		}

		try {
			await deleteNews(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
