'use strict';

const countries = require('i18n-iso-countries')
	, countryNamesMap = countries.getNames('en')
	, countryCodes = Object.keys(countryNamesMap);

module.exports = {
	countryNamesMap,
	countryCodes,
}
