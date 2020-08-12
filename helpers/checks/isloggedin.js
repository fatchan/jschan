'use strict';

module.exports = async (req, res, next) => {
	if (res.locals.user) {
		return next();
	}
	let goto;
	if (req.method === 'GET' && req.path) {
		//coming from a GET page isLoggedIn middleware check
		goto = req.path;
	}
	return res.redirect(`/login.html${goto ? '?goto='+goto : ''}`);
}
