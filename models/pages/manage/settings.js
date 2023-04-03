'use strict';

const { themes, codeThemes } = require(__dirname+'/../../../lib/misc/themes.js')
	, i18n = require(__dirname+'/../../../lib/locale/locale.js')
	, { getCountryNames, countryCodes } = require(__dirname+'/../../../lib/misc/countries.js');

module.exports = async (req, res) => {

	res
		.set('Cache-Control', 'private, max-age=5')
		.render('managesettings', {
			csrf: req.csrfToken(),
			permissions: res.locals.permissions,
			countryNamesMap: getCountryNames(res.locals.locale, { select: 'official' }),
			countryCodes,
			themes,
			codeThemes,
			languages: i18n.getLocales(),
		});

};
