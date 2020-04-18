'use strict';

const removeBans = require(__dirname+'/../../models/forms/removebans.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, denyAppeals = require(__dirname+'/../../models/forms/denybanappeals.js');

module.exports = async (req, res, next) => {

	const errors = [];

	if (!req.body.checkedbans || req.body.checkedbans.length === 0 || req.body.checkedbans.length > 10) {
		errors.push('Must select 1-10 bans')
	}
	if (!req.body.option || (req.body.option !== 'unban' && req.body.option !== 'deny_appeal')) {
		errors.push('Invalid ban action')
	}

	const redirect = req.params.board ? `/${req.params.board}/manage/bans.html` : '/globalmanage/bans.html';

	if (errors.length > 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': errors,
			redirect
		});
	}

	let amount = 0;
	let message;
	try {
		if (req.body.option === 'unban') {
			amount = await removeBans(req, res, next);
			message = `Removed ${amount} bans`;
		} else {
			amount = await denyAppeals(req, res, next);
			message = `Denied ${amount} appeals`;
		}
	} catch (err) {
		return next(err);
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		message,
		redirect
	});

}
