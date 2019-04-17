'use strict';

const hasPerms = require(__dirname+'/hasperms.js');

module.exports = async (req, res, next) => {

	if (!hasPerms(req, res)) {
		return res.status(403).render('message', {
			'title': 'Forbidden',
			'message': 'You do not have permission to access this page',
			'redirect': '/'
		});
	}
	next();

}
