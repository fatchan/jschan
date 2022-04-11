'use strict';

const addAssets = require(__dirname+'/../../models/forms/addassets.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, deleteTempFiles = require(__dirname+'/../../lib/file/deletetempfiles.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

//almost a copy of banners code, since it can be handled the same. maybe refactor both into 1 with a "type" arg or something
//or allowing 2 types to accommodate flags too where they are named (not the object.keys & .values use in manageassets template)
module.exports = {

	//paramConverter: paramConverter({}),

	controller: async (req, res, next) => {

		const { globalLimits } = config.get;
		const errors = [];

		if (res.locals.numFiles === 0) {
			errors.push('Must provide a file');
		} else if (res.locals.numFiles > globalLimits.assetFiles.max) {
			errors.push(`Exceeded max asset uploads in one request of ${globalLimits.assetFiles.max}`);
		} else if (res.locals.board.assets.length+res.locals.numFiles > globalLimits.assetFiles.total) {
			errors.push(`Total number of assets would exceed global limit of ${globalLimits.assetFiles.total}`);
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
			await addAssets(req, res, next);
		} catch (err) {
			await deleteTempFiles(req).catch(e => console.error);
			return next(err);
		}

	}

}
