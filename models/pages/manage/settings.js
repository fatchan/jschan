'use strict';

const { themes, codeThemes } = require(__dirname+'/../../../lib/misc/themes.js')
	, { countryNamesMap, countryCodes } = require(__dirname+'/../../../lib/misc/countries.js')

module.exports = async (req, res, next) => {

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('managesettings', {
		csrf: req.csrfToken(),
		permissions: res.locals.permissions,
		countryNamesMap,
		countryCodes,
		themes,
		codeThemes,
	});

}
