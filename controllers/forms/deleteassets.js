'use strict';

const deleteAssets = require(__dirname+'/../../models/forms/deleteassets.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		allowedArrays: ['checkedassets']
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedassets, 1), expected: false, error: 'Must select at least one asset to delete' },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': `/${req.params.board}/manage/assets.html`
			})
		}

		for (let i = 0; i < req.body.checkedassets.length; i++) {
			if (!res.locals.board.assets.includes(req.body.checkedassets[i])) {
				return dynamicResponse(req, res, 400, 'message', {
					'title': 'Bad request',
					'message': 'Invalid assets selected',
					'redirect': `/${req.params.board}/manage/assets.html`
				})
			}
		}

		try {
			await deleteAssets(req, res, next);
		} catch (err) {
			console.error(err);
			return next(err);
		}

	}

}
