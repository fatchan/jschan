'use strict';

module.exports = async (req, res, next) => {
	if (req.session && req.session.authenticated === true) {
		return next();
	}
	let goto;
	if (req.method === 'GET' && req.path) {
		//coming from a GET page isLoggedIn middleware check
		goto = encodeURIComponent(req.path);
	}
	return res.redirect(`/login.html${goto ? '?goto='+goto : ''}`);
}
