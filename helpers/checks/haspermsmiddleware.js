'use strict';

module.exports = (requiredLevel) => {

	return function(req, res, next) {
		if (res.locals.permLevel > requiredLevel) {
			return res.status(403).render('message', {
				'title': 'Forbidden',
				'message': 'No Permission',
				'redirect': '/'
			});
		}
		next();
	}

}
