'use strict';

const addAssets = require(__dirname+'/../../models/forms/addassets.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, deleteTempFiles = require(__dirname+'/../../lib/file/deletetempfiles.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, { checkSchema, numberBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	//paramConverter: paramConverter({}),

	controller: async (req, res, next) => {

		const { globalLimits } = config.get;

		const errors = await checkSchema([
			{ result: res.locals.numFiles === 0, expected: false, blocking: true, error: 'Must provide a file' },
			{ result: numberBody(res.locals.numFiles, 0, globalLimits.assetFiles.max), expected: true, error: `Exceeded max asset uploads in one request of ${globalLimits.assetFiles.max}` },
			{ result: numberBody(res.locals.board.assets.length+res.locals.numFiles, 0, globalLimits.assetFiles.max), expected: true, error: `Total number of assets would exceed global limit of ${globalLimits.assetFiles.total}` },
		]);

		if (errors.length > 0) {
			await deleteTempFiles(req).catch(console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': `/${req.params.board}/manage/assets.html`
			});
		}

		try {
			await addAssets(req, res, next);
		} catch (err) {
			await deleteTempFiles(req).catch(console.error);
			return next(err);
		}

	}

};
