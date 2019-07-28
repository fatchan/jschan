'use strict';

const hasPerms = require(__dirname+'/hasperms.js');

module.exports = (requiredLevel) => {

	return function(req, res, next) {
		const authLevel = hasPerms(req, res);
		if (authLevel > requiredLevel) {
			return res.status(403).render('message', {
				'title': 'Forbidden',
				'message': 'No Permission',
				'redirect': '/'
			});
		}
		next();
	}

}
