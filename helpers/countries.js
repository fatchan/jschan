'use strict';

const countries = require('i18n-iso-countries')
	, countryNamesMap = countries.getNames('en')
	, countryCodes = Object.keys(countryNamesMap);

countryNamesMap['XX'] = 'Unknown';
countryNamesMap['T1'] = 'Tor Exit Node';

module.exports = {
	countryNamesMap,
	countryCodes,
}
