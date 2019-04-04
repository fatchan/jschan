'use strict';

module.exports = (req, res) => {
	return req.session.authenticated //if the user is authed
		&& req.session.user //if the user is logged in
		&& (req.session.user.authLevel > 1
			|| res.locals.board.owner == req.session.user.username
			|| res.locals.board.moderators.includes(req.session.user.username));
}
