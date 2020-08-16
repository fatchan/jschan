'use strict';

const { globalLimits, ipHashPermLevel } = require(__dirname+'/../../configs/main.js')
	, addBan = require(__dirname+'/../../models/forms/addban.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { isIP } = require('net');

module.exports = async (req, res, next) => {

	const errors = [];

	if (!req.body.ip || req.body.ip.length === 0) {
		errors.push('Missing IP/hash input');
	} else if (req.body.ip.length > 50) {
		errors.push('IP/hash input must be less than 50 characters');
	} else if (res.locals.permLevel > ipHashPermLevel && (isIP(req.body.ip) || req.body.ip.length !== 10)) {
		errors.push('Invalid hash input');
	}
	if (req.body.ban_reason && req.body.ban_reason.length > globalLimits.fieldLength.ban_reason) {
		errors.push(`Ban reason must be ${globalLimits.fieldLength.ban_reason} characters or less`);
	}
	if (req.body.log_message && req.body.log_message.length > globalLimits.fieldLength.log_message) {
		errors.push(`Modlog message must be ${globalLimits.fieldLength.log_message} characters or less`);
	}

	let redirect = req.headers.referer;
	if (!redirect) {
		if (!req.params.board) {
			redirect = '/globalmanage/bans.html';
		} else {
			redirect = `/${req.params.board}/manage/bans.html`;
		}
	}

	if (errors.length > 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': errors,
			redirect,
		});
	}

	try {
		await addBan(req, res, redirect);
	} catch (err) {
		return next(err);
	}

}

