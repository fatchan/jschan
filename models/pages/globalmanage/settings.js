'use strict';

const cache = require(__dirname+'/../../../redis.js');

module.exports = async (req, res, next) => {

	let settings = await cache.get('globalsettings');
	if (!settings) {
		settings = {
			captchaMode: 0,
			filters: [],
			filterMode: 0,
			filterBanDuration: 0,
		}
		cache.setnx('globalsettings', settings);
	}

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('globalmanagesettings', {
		csrf: req.csrfToken(),
		settings,
	});

}
