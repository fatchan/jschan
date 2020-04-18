'use strict';

const addNews = require(__dirname+'/../../models/forms/addnews.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js');

module.exports = async (req, res, next) => {

	const errors = [];

	if (!req.body.message || req.body.message.length === 0) {
		errors.push('Missing message');
	}
	if (req.body.message.length > 10000) {
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
			'redirect': '/globalmanage/news.html'
		});
	}

	try {
		await addNews(req, res, next);
	} catch (err) {
		return next(err);
	}

}
