'use strict';

const editNews = require(__dirname+'/../../models/forms/editnews.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js');

module.exports = async (req, res, next) => {

	const errors = [];

	if (!req.body.news_id) {
		errors.push('Missing news id');
	}
	if (!req.body.message || res.locals.messageLength === 0) {
		errors.push('Missing message');
	}
	if (res.locals.messageLength > 10000) {
		errors.push('Message must be 10000 characters or less');
	}
	if (!req.body.title || req.body.title.length === 0) {
		errors.push('Missing title');
	}
	if (req.body.title.length > 50) {
		errors.push('Title must be 50 characters or less');
	}

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
