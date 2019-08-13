'use strict';

const removeBans = require(__dirname+'/../../models/forms/removebans.js');

module.exports = async (req, res, next) => {

	//keep this for later in case i add other options to unbans
	const errors = [];

	if (!req.body.checkedbans || req.body.checkedbans.length === 0 || req.body.checkedbans.length > 10) {
		errors.push('Must select 1-10 bans')
	}

	const redirect = req.params.board ? `/${req.params.board}/manage.html` : '/globalmanage.html';

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			redirect
		});
	}

	let amount = 0;
	try {
		amount = await removeBans(req, res, next);
	} catch (err) {
		return next(err);
	}

	return res.render('message', {
		'title': 'Success',
		'message': `Removed ${amount} bans`,
		redirect
	});

}
