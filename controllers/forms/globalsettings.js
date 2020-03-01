'use strict';

const changeGlobalSettings = require(__dirname+'/../../models/forms/changeglobalsettings.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js');

module.exports = async (req, res, next) => {

	const errors = [];

	if (req.body.filters && req.body.filters.length > 2000) {
		errors.push('Filters length must be 2000 characters or less');
	}
/*
	if (typeof req.body.captcha_mode === 'number' && (req.body.captcha_mode < 0 || req.body.captcha_mode > 2)) {
		errors.push('Invalid captcha mode.');
	}
*/
	if (typeof req.body.filter_mode === 'number' && (req.body.filter_mode < 0 || req.body.filter_mode > 2)) {
		errors.push('Invalid filter mode.');
	}
	if (typeof req.body.ban_duration === 'number' && req.body.ban_duration <= 0) {
		errors.push('Invalid filter auto ban duration.');
	}

	if (errors.length > 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/globalmanage/settings.html'
		});
	}

	try {
		await changeGlobalSettings(req, res, next);
	} catch (err) {
		return next(err);
	}

}
