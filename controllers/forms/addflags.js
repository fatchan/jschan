'use strict';

const addFlags = require(__dirname+'/../../models/forms/addflags.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, deleteTempFiles = require(__dirname+'/../../helpers/files/deletetempfiles.js')
	, config = require(__dirname+'/../../config.js');

module.exports = async (req, res, next) => {

	const { globalLimits } = config.get;
	const errors = [];

	if (res.locals.numFiles === 0) {
		errors.push('Must provide a file');
	} else if (res.locals.numFiles > globalLimits.flagFiles.max) {
		errors.push(`Exceeded max flag uploads in one request of ${globalLimits.flagFiles.max}`);
	} else if (res.locals.board.flags.length+res.locals.numFiles > globalLimits.flagFiles.total) {
		errors.push(`Total number of flags would exceed global limit of ${globalLimits.flagFiles.total}`);
	}

	if (errors.length > 0) {
		await deleteTempFiles(req).catch(e => console.error);
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/manage/flags.html`
		})
	}

	try {
		await addFlags(req, res, next);
	} catch (err) {
		await deleteTempFiles(req).catch(e => console.error);
		return next(err);
	}

}
