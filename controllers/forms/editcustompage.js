'use strict';

const editCustomPage = require(__dirname+'/../../models/forms/editcustompage.js')
	, { CustomPages } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, existsBody } = require(__dirname+'/../../lib/input/schema.js')
	, config = require(__dirname+'/../../lib/misc/config.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['message', 'title', 'page'],
		processMessageLength: true,
		objectIdFields: ['page_id'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const { globalLimits } = config.get;

		const errors = await checkSchema([
			{ result: existsBody(req.body.page_id), expected: true, error: __('Missing page id') },
			{ result: existsBody(req.body.message), expected: true, error: __('Missing message') },
			{ result: existsBody(req.body.title), expected: true, error: __('Missing title') },
			{ result: existsBody(req.body.page), expected: true, error: __('Missing .html name') },
			{ result: () => {
				if (req.body.page) {
					return /^[a-z0-9_-]+$/i.test(req.body.page);
				}
				return false;
			} , expected: true, error: __('.html name must contain a-z 0-9 _ - only') },
			{ result: numberBody(res.locals.messageLength, 0, globalLimits.customPages.maxLength), expected: true, error: __('Message must be %s characters or less', globalLimits.customPages.maxLength) },
			{ result: lengthBody(req.body.title, 0, 50), expected: false, error: __('Title must be 50 characters or less') },
			{ result: lengthBody(req.body.page, 0, 50), expected: false, error: __('.html name must be 50 characters or less') },
			{ result: async () => {
				const existingPage = await CustomPages.findOne(req.params.board, req.body.page);
				if (existingPage && existingPage.page === req.body.page) {
					return existingPage._id.equals(req.body.page_id);
				}
				return true;
			}, expected: true, error: __('.html name must be unique') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
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

};
