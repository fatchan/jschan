'use strict';

const { Accounts } = require(__dirname+'/../db/');

module.exports = async (req, res, next) => {
	if (req.session && req.session.authenticated === true) {
		// keeping session updated incase user updated on global manage
		const account = await Accounts.findOne(req.session.user.username);
		req.session.user = {
			'username': account._id,
			'authLevel': account.authLevel
		};
	}
	next();
}
