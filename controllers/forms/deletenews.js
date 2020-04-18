'use strict';

const deleteNews = require(__dirname+'/../../models/forms/deletenews.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js');

module.exports = async (req, res, next) => {

	const errors = [];

	if (!req.body.checkednews || req.body.checkednews.length === 0 || req.body.checkednews.length > 10) {
		errors.push('Must select 1-10 newsposts delete');
	}

	if (errors.length > 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/globalmanage/news.html'
		})
	}

	try {
		await deleteNews(req, res, next);
	} catch (err) {
		return next(err);
	}

}
