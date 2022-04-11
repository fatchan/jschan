'use strict';

const editNews = require(__dirname+'/../../models/forms/editnews.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['message', 'title'],
		processMessageLength: true,
		objectIdFields: ['news_id'],
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: existsBody(req.body.news_id), expected: true, error: 'Missing news id' },
			{ result: existsBody(req.body.message), expected: true, error: 'Missing message' },
			{ result: numberBody(res.locals.messageLength, 0, 10000), expected: true, error: 'Message must be 10000 characters or less' },
			{ result: existsBody(req.body.title), expected: true, error: 'Missing title' },
			{ result: lengthBody(req.body.title, 0, 50), expected: false, error: 'Title must be 50 characters or less' },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': req.headers.referer || '/globalmanage/news.html'
			});
		}

		try {
			await editNews(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
