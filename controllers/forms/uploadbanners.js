'use strict';

const uploadBanners = require(__dirname+'/../../models/forms/uploadbanners.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, deleteTempFiles = require(__dirname+'/../../lib/file/deletetempfiles.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, { checkSchema, numberBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	//paramConverter: paramConverter({}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const { globalLimits } = config.get;

		const errors = await checkSchema([
			{ result: res.locals.numFiles === 0, expected: false, blocking: true, error: __('Must provide a file') },
			{ result: numberBody(res.locals.numFiles, 0, globalLimits.bannerFiles.max), expected: true, error: __('Exceeded max banner uploads in one request of %s', globalLimits.bannerFiles.max) },
			{ result: numberBody(res.locals.board.banners.length+res.locals.numFiles, 0, globalLimits.bannerFiles.total), expected: true, error: __('Total number of banners would exceed global limit of %s', globalLimits.bannerFiles.total) },
		]);

		if (errors.length > 0) {
			await deleteTempFiles(req).catch(console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': `/${req.params.board}/manage/assets.html`
			});
		}

		try {
			await uploadBanners(req, res, next);
		} catch (err) {
			await deleteTempFiles(req).catch(console.error);
			return next(err);
		}

	}

};
