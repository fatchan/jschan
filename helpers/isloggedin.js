'use strict';

module.exports = (req, res, next) => {
	if (req.session.authenticated === true) {
		return next();
	}
	const redirect = req.params.board;
	if (redirect) {
		res.redirect(`/login?redirect=${redirect}`);
	} else {
		res.redirect('/login');
	}
}
