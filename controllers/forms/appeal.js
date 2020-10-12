'use strict';

const appealBans = require(__dirname+'/../../models/forms/appeal.js')
	, { globalLimits } = require(__dirname+'/../../configs/main.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { Bans } = require(__dirname+'/../../db');

module.exports = async (req, res, next) => {

	const errors = [];
	if (!req.body.checkedbans || req.body.checkedbans.length === 0 || req.body.checkedbans.length > 10) {
		errors.push('Must select 1-10 bans');
	}
	if (!req.body.message || res.locals.messageLength === 0) {
		errors.push('Appeals must include a message');
	}
	if (res.locals.messageLength > globalLimits.fieldLength.message) {
		errors.push('Appeal message must be 2000 characters or less');
	}

	if (errors.length > 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/'
		});
	}

	let amount = 0;
	try {
		amount = await appealBans(req, res, next);
	} catch (err) {
		return next(err);
	}

	if (amount === 0) {
		/*
			this can occur if they selected invalid id, non-ip match, already appealed, or unappealable bans. prevented by databse filter, so we use
			use the updatedCount return value to check if any appeals were made successfully. if not, we end up here.
		*/
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'error': 'Invalid bans selected',
			'redirect': '/'
		});
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': `Appealed ${amount} bans successfully`,
		'redirect': '/'
	});

}
