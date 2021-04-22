'use strict';

const deleteBanners = require(__dirname+'/../../models/forms/deletebanners.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		allowedArrays: ['checkedbanners']
	}),

	controller: async (req, res, next) => {

		const errors = [];

		if (!req.body.checkedbanners || req.body.checkedbanners.length === 0) {
			errors.push('Must select at least one banner to delete');
		}

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': `/${req.params.board}/manage/assets.html`
			})
		}

		for (let i = 0; i < req.body.checkedbanners.length; i++) {
			if (!res.locals.board.banners.includes(req.body.checkedbanners[i])) {
				return dynamicResponse(req, res, 400, 'message', {
					'title': 'Bad request',
					'message': 'Invalid banners selected',
					'redirect': `/${req.params.board}/manage/assets.html`
				})
			}
		}

		try {
			await deleteBanners(req, res, next);
		} catch (err) {
			console.error(err);
			return next(err);
		}

	}

}
