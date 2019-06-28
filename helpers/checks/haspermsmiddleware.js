'use strict';

const hasPerms = require(__dirname+'/hasperms.js');

module.exports = async (req, res, next) => {

	res.locals.hasPerms = hasPerms(req, res);
	if (!res.locals.hasPerms) {
		return res.status(403).render('message', {
			'title': 'Forbidden',
			'message': 'You do not have permission to access this page',
			'redirect': '/'
		});
	}
	next();

}
