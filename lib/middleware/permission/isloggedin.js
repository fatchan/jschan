'use strict';

module.exports = async (req, res, next) => {
	if (res.locals.user) {
		return next();
	}
	let goto;
	if (req.method === 'GET' && req.path) {
		//coming from a GET page isLoggedIn middleware check
		goto = encodeURIComponent(req.path);
	}
	if (req.params.board && req.params.id) {
		if (req.path.includes('/manage/thread/')) {
			return res.redirect(`/${req.params.board}/thread/${req.params.id}.html`);
		}
	}
	return res.redirect(`/login.html${goto ? '?goto='+goto : ''}`);
};
