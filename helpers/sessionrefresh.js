'use strict';

const { Accounts } = require(__dirname+'/../db/');

module.exports = async (req, res, next) => {
	if (req.session && req.session.user) {
		// keeping session updated incase user updated on global manage
		const account = await Accounts.findOne(req.session.user.username);
		if (!account) {
			req.session.destroy();
		} else {
			res.locals.user = {
				'username': account._id,
				'authLevel': account.authLevel,
				'modBoards': account.modBoards,
				'ownedBoards': account.ownedBoards,
			};
		}
	}
	next();
}
