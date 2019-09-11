'use strict';

const { Accounts } = require(__dirname+'/../../../db/');

module.exports = async (req, res, next) => {

	let accounts;
	try {
		accounts = await Accounts.find();
	} catch (err) {
		return next(err)
	}

	res.render('globalmanageaccounts', {
		csrf: req.csrfToken(),
		accounts,
	});

}
