'use strict';

const editAccounts = require(__dirname+'/../../models/forms/editaccounts.js');

module.exports = async (req, res, next) => {

	const errors = [];

	if (!req.body.checkedaccounts || req.body.checkedaccounts.length === 0 || req.body.checkedaccounts.length > 10) {
        errors.push('Must select 1-10 accounts');
    }
	if (!req.body.auth_level && !req.body.delete_account) {
		errors.push('Missing auth level or delete action');
	}
	if (typeof req.body.auth_level === 'number' && req.body.auth_level < 0 || req.body.auth_level > 4) {
		errors.push('Auth level must be 0-4');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/globalmanage.html'
		})
	}

	try {
		await editAccounts(req, res, next);
	} catch (err) {
		return next(err);
	}

}
