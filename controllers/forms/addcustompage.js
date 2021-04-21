'use strict';

const addCustomPage = require(__dirname+'/../../models/forms/addcustompage.js')
	, { CustomPages } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, config = require(__dirname+'/../../config.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['message', 'title', 'page'],
		processMessageLength: true,
	}),

	controller: async (req, res, next) => {

		const { globalLimits } = config.get;
		const errors = [];

		if (!req.body.message || res.locals.messageLength === 0) {
			errors.push('Missing message');
		}
		if (res.locals.messageLength > globalLimits.customPages.maxLength) {
			errors.push(`Message must be ${globalLimits.customPages.maxLength} characters or less`);
		}
		if (!req.body.title || req.body.title.length === 0) {
			errors.push('Missing title');
		}
		if (req.body.title.length > 50) {
			errors.push('Title must be 50 characters or less');
		}
		if (!req.body.page
			|| req.body.page.length === 0) {
			errors.push('Missing .html name');
		}
		if (/[a-z0-9_-]+/.test(req.body.page) !== true) {
			errors.push('.html name must contain a-z 0-9 _ - only');
		}
		if (req.body.title.length > 50) {
			errors.push('.html name must be 50 characters or less');
		}
		if ((await CustomPages.boardCount(req.params.board)) > globalLimits.customPages.max) {
			errors.push(`Can only create ${globalLimits.customPages.max} pages per board`);
		}
		if ((await CustomPages.findOne(req.params.board, req.body.page))) {
			errors.push('.html name must be unique');
		}

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': `/${req.params.booard}/manage/custompages.html`
			});
		}

		try {
			await addCustomPage(req, res, next);
		} catch (err) {
			return next(err);
		}

	}
}
