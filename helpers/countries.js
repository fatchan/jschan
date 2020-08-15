'use strict';

const countries = require('i18n-iso-countries')
	, countryNamesMap = countries.getNames('en')
	, countryCodes = ['XX', 'T1', 'TOR']
		.concat(Object.keys(countryNamesMap));

countryNamesMap['XX'] = 'Unknown';
countryNamesMap['T1'] = 'Tor Exit Node';
countryNamesMap['TOR'] = 'Tor Onion';

module.exports = {
	countryNamesMap,
	countryCodes,
}
