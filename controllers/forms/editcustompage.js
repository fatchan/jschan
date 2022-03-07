'use strict';

const editCustomPage = require(__dirname+'/../../models/forms/editcustompage.js')
	, { CustomPages } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js')
	, config = require(__dirname+'/../../config.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['message', 'title', 'page'],
		processMessageLength: true,
		objectIdFields: ['page_id'],
	}),

	controller: async (req, res, next) => {

		const { globalLimits } = config.get;

		const errors = await checkSchema([
			{ result: existsBody(req.body.page_id), expected: true, error: 'Missing page id' },
			{ result: existsBody(req.body.message), expected: true, error: 'Missing message' },
			{ result: existsBody(req.body.title), expected: true, error: 'Missing title' },
			{ result: existsBody(req.body.page), expected: true, error: 'Missing .html name' },
			{ result: () => {
				if (req.body.page) {
					return /^[a-z0-9_-]+$/i.test(req.body.page);
				}
				return false;
			} , expected: true, error: '.html name must contain a-z 0-9 _ - only' },
			{ result: numberBody(res.locals.messageLength, 0, globalLimits.customPages.maxLength), expected: true, error: `Message must be ${globalLimits.customPages.maxLength} characters or less` },
			{ result: lengthBody(req.body.title, 0, 50), expected: false, error: 'Title must be 50 characters or less' },
			{ result: lengthBody(req.body.page, 0, 50), expected: false, error: '.html name must be 50 characters or less' },
			{ result: async () => {
				const existingPage = await CustomPages.findOne(req.params.board, req.body.page);
				if (existingPage && existingPage.page === req.body.page) {
					return existingPage._id.equals(req.body.page_id);
				}
				return true;
			}, expected: true, error: '.html name must be unique'},
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': req.headers.referer || `/${req.params.board}/manage/custompages.html`,
			});
		}

		try {
			await editCustomPage(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
