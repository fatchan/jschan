'use strict';

const appealBans = require(__dirname+'/../../models/forms/appeal.js')
	, { Bans } = require(__dirname+'/../../db');

module.exports = async (req, res, next) => {

	//keep this for later in case i add other options to unbans
	const errors = [];

	if (!req.body.checkedbans || req.body.checkedbans.length === 0 || req.body.checkedbans.length > 10) {
		errors.push('Must select 1-10 bans');
	}
	if (!req.body.message || req.body.message.length === 0) {
		errors.push('Appeals must include a message');
	}
	if (req.body.message.length > 2000) {
		errors.push('Appeal message must be less than 2000 characters');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
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
		return res.status(400).render('message', {
			'title': 'Bad request',
			'error': 'Invalid bans selected',
			'redirect': '/'
		});
	}

	return res.render('message', {
		'title': 'Success',
		'message': `Appealed ${amount} bans successfully`,
		'redirect': '/'
	});

}
