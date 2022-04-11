'use strict';

const cache = require(__dirname+'/../../../lib/redis/redis.js')
	, config = require(__dirname+'/../../../lib/misc/config.js')
	, { themes, codeThemes } = require(__dirname+'/../../../lib/misc/themes.js')
	, { countryNamesMap, countryCodes } = require(__dirname+'/../../../lib/misc/countries.js');

module.exports = async (req, res, next) => {

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('globalmanagesettings', {
		csrf: req.csrfToken(),
		settings: config.get,
		permissions: res.locals.permissions,
		countryNamesMap,
		countryCodes,
		themes,
		codeThemes,
	});

}
