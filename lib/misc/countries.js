'use strict';

const countries = require('i18n-iso-countries')
	, countryNamesMap = countries.getNames('en')
	, extraCountryCodes = ['EU', 'XX', 'T1']
	, anonymizerCountryCodes = ['TOR', 'LOKI']
	, anonymizerCountryCodesSet = new Set(anonymizerCountryCodes)
	, countryCodes = Object.keys(countryNamesMap).concat(extraCountryCodes, anonymizerCountryCodes)
	, i18n = require(__dirname+'/../locale/locale.js')
	, extraCountryNames = Object.seal(Object.freeze(Object.preventExtensions({
		'EU': 'Europe',
		'XX': 'Unknown',
		'T1': 'Tor Exit Node',
		'TOR': 'Tor Hidden Service',
		'LOKI': 'Lokinet SNApp',
	})));

//Monkey patch until https://github.com/michaelwittig/node-i18n-iso-countries/issues/322
const alpha3s = countries.getAlpha3Codes();
alpha3s['TOR'] = 'TOR';
alpha3s['LOKI'] = 'LOKI';

i18n.getLocales()
	.forEach(locale => {
		const localeExtraCodesMap = { ...extraCountryNames };
		for (const code in localeExtraCodesMap) {
			localeExtraCodesMap[code] = i18n.__({
				phrase: localeExtraCodesMap[code],
				locale: locale,
			});
		}
		/* We are basically overwriting the existing locales in countries,
		but with translated extra codes added */
		const splitLocale = locale.split('-')[0]; //i18n-iso-countries doesnt have variants
		countries.registerLocale({
			locale: locale.toLowerCase(), //i18n-iso-countries toLowerCases these internally... ffs
			countries: {
				...countries.getNames(splitLocale, { select: 'official' }),
				...localeExtraCodesMap,
			},
		});
	});

module.exports = {
	countryCodes,
	countryCodesSet: new Set(countryCodes),
	getCountryNames: countries.getNames,
	getCountryName: countries.getName,
	isAnonymizer: (code) => {
		return anonymizerCountryCodesSet.has(code);
	},
};
