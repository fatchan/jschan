'use strict';

const deleteFlags = require(__dirname+'/../../models/forms/deleteflags.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		allowedArrays: ['checkedflags'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedflags, 1), expected: false, error: __('Must select at least one flag to delete') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': `/${req.params.board}/manage/assets.html`
			});
		}

		for (let i = 0; i < req.body.checkedflags.length; i++) {
			if (!res.locals.board.flags[req.body.checkedflags[i]]) {
				return dynamicResponse(req, res, 400, 'message', {
					'title': __('Bad request'),
					'message': __('Invalid flags selected'),
					'redirect': `/${req.params.board}/manage/assets.html`
				});
			}
		}

		try {
			await deleteFlags(req, res, next);
		} catch (err) {
			console.error(err);
			return next(err);
		}

	}

};
