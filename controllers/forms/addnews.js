'use strict';

const addNews = require(__dirname+'/../../models/forms/addnews.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['message', 'title'],
		processMessageLength: true,
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: existsBody(req.body.message), expected: true, error: 'Missing message' },
			{ result: existsBody(req.body.title), expected: true, error: 'Missing title' },
			{ result: lengthBody(req.body.message, 1, 10000), expected: false, error: 'Message must be 10000 characters or less' },
			{ result: lengthBody(req.body.title, 1, 50), expected: false, error: 'Title must be 50 characters or less' },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
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

}
