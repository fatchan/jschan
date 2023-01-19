/* eslint-disable no-unused-vars */
/* globals LANG */

const pluralMap = {
	1: 'one',
	// two, three, few, many, ...
};

//simple translation
const __ = (key) => {
	return LANG[key];
};

//plurals+replace %s with count
const __n = (key, count) => {
	const pluralKey = pluralMap[count] || 'other';
	return LANG[key][pluralKey].replace('%s', count);
};
