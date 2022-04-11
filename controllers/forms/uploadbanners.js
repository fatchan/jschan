'use strict';

const uploadBanners = require(__dirname+'/../../models/forms/uploadbanners.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, deleteTempFiles = require(__dirname+'/../../lib/file/deletetempfiles.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	//paramConverter: paramConverter({}),

	controller: async (req, res, next) => {

		const { globalLimits } = config.get;
		const errors = [];

		if (res.locals.numFiles === 0) {
			errors.push('Must provide a file');
		} else if (res.locals.numFiles > globalLimits.bannerFiles.max) {
			errors.push(`Exceeded max banner uploads in one request of ${globalLimits.bannerFiles.max}`);
		} else if (res.locals.board.banners.length+res.locals.numFiles > globalLimits.bannerFiles.total) {
			errors.push(`Total number of banners would exceed global limit of ${globalLimits.bannerFiles.total}`);
		}

		if (errors.length > 0) {
			await deleteTempFiles(req).catch(e => console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': `/${req.params.board}/manage/assets.html`
			})
		}

		try {
			await uploadBanners(req, res, next);
		} catch (err) {
			await deleteTempFiles(req).catch(e => console.error);
			return next(err);
		}

	}

}
