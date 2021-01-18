'use strict';

const countries = require('i18n-iso-countries')
	, countryNamesMap = countries.getNames('en')
	, extraCountryCodes = ['EU', 'XX', 'T1']
	, anonymizerCountryCodes = ['TOR', 'LOKI']
	, anonymizerCountryCodesSet = new Set(anonymizerCountryCodes)
	, countryCodes = Object.keys(countryNamesMap)
		.concat(extraCountryCodes, anonymizerCountryCodes);

//this dumb library conveniently includes 2 names for some countries...
Object.entries(countryNamesMap)
	.filter(e => Array.isArray(e[1])) //for any country with an array of names,
	.forEach(c => countryNamesMap[c[0]] = c[1][0]) //use the first name

countryNamesMap['EU'] = 'Europe';
countryNamesMap['XX'] = 'Unknown';
countryNamesMap['T1'] = 'Tor Exit Node';
countryNamesMap['TOR'] = 'Tor Hidden Service';
countryNamesMap['LOKI'] = 'Lokinet SNApp';

module.exports = {
	countryNamesMap,
	countryCodes,
	isAnonymizer: (code) => {
		return anonymizerCountryCodesSet.has(code);
	},
}
