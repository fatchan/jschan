'use strict';

const cache = require(__dirname+'/../../../redis.js')
	, config = require(__dirname+'/../../../config.js')
	, { themes, codeThemes } = require(__dirname+'/../../../helpers/themes.js')
	, { countryNamesMap, countryCodes } = require(__dirname+'/../../../helpers/countries.js');

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
