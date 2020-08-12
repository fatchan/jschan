'use strict';

module.exports = (req, res) => {
	if (req.session) {
		const { user } = res.locals;
		if (user != null) {
			if (user.authLevel < 4) { //assigned levels
				return user.authLevel;
			}
			if (res.locals.board != null) {
				if (res.locals.board.owner === user.username) {
					return 2; //board owner 2
				} else if (res.locals.board.settings.moderators.includes(user.username) === true) {
					return 3; //board staff 3
				}
			}
		}
	}
	return 4; //not logged in, not staff or moderator
}
