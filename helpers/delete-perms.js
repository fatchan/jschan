'use strict';

module.exports = (req, res) => {
	return req.session.authenticated //if the user is authed
		&&
		req.session.user //if the user is logged in
		&&
		(req.session.user.authLevel != 3 //and is an admin
		|| res.locals.board.owner != req.session.user.username //or is the board owner
		|| !res.local.board.moderators.includes(req.session.user.username)); //or is a moderator
}
