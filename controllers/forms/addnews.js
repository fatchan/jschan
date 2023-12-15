'use strict';

const addNews = require(__dirname+'/../../models/forms/addnews.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['message', 'title'],
		processMessageLength: true,
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const { globalLimits } = config.get;

		const errors = await checkSchema([
			{ result: existsBody(req.body.message), expected: true, error: __('Missing message') },
			{ result: existsBody(req.body.title), expected: true, error: __('Missing title') },
			{ result: numberBody(res.locals.messageLength, 0, globalLimits.fieldLength.message), expected: true, error: __('Message must be %s characters or less', globalLimits.fieldLength.message) },
			{ result: lengthBody(req.body.title, 0, 50), expected: false, error: __('Title must be 50 characters or less') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': '/globalmanage/news.html'
			});
		}

		try {
			await addNews(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
