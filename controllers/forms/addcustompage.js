'use strict';

const addCustomPage = require(__dirname+'/../../models/forms/addcustompage.js')
	, { CustomPages } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['message', 'title', 'page'],
		processMessageLength: true,
	}),

	controller: async (req, res, next) => {

		const { globalLimits } = config.get;

		const errors = await checkSchema([
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
				return (await CustomPages.boardCount(req.params.board)) > globalLimits.customPages.max;
			}, expected: false, error: `Can only create ${globalLimits.customPages.max} pages per board`},
			{ result: async () => {
				return (await CustomPages.findOne(req.params.board, req.body.page)) == null;
			}, expected: true, error: '.html name must be unique'},
		]);

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
