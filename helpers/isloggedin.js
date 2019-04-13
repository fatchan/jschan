'use strict';

module.exports = (req, res, next) => {
	if (req.session.authenticated === true) {
		return next();
	}
	res.redirect('/login');
}
