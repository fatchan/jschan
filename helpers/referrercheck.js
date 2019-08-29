'use strict';

const configs = require(__dirname+'/../configs/main.json')
	, refererRegex = new RegExp(configs.refererRegex);

module.exports = (req, res, next) => {
	if (req.method !== 'POST') {
		return next();
	}
	if (configs.refererCheck === true && (!req.headers.referer || !req.headers.referer.match(refererRegex))) {
		return res.status(403).render('message', {
			'title': 'Forbidden',
			'message': 'Invalid or missing "Referer" header. Are you posting from the correct URL?'
		});
	}
	next();
}
