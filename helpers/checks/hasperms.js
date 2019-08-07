'use strict';

module.exports = (req, res) => {
	const { authenticated, user } = req.session;
	if (authenticated === true && user != null) {
		if (user.authLevel <= 1) {
			return user.authLevel; //admin 0, global staff, 1
		}
		if (res.locals.board != null) {
			if (res.locals.board.owner === user.username) {
				return 2; //board owner 2
			} else if (res.locals.board.settings.moderators.includes(user.username) === true) {
				return 3; //board staff 3
			}
		}
	}
	return 4; //not logged in, not staff or moderator
}
