'use strict';

const cache = require(__dirname+'/../../../redis.js')
	, { themes, codeThemes } = require(__dirname+'/../../../helpers/themes.js')
	, { countryNamesMap, countryCodes } = require(__dirname+'/../../../helpers/countries.js');

module.exports = async (req, res, next) => {

	let settings = await cache.get('globalsettings');

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('globalmanagesettings', {
		csrf: req.csrfToken(),
		settings,
		countryNamesMap,
		countryCodes,
		themes,
		codeThemes,
	});

}
