'use strict';

const countries = require('i18n-iso-countries')
	, countryNamesMap = countries.getNames('en')
	, countryCodes = ['EU', 'XX', 'T1', 'TOR', 'LOKI']
		.concat(Object.keys(countryNamesMap));

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
}
