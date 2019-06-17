'use strict';

module.exports = (req, res, next) => {
	if (req.session.authenticated === true) {
		return next();
	}
	const board = req.params ? req.params.board : null;
	res.redirect(`/login.html${board ? '?goto=/'+board+'/manage.html' : ''}`);
}
