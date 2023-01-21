/* eslint-disable no-unused-vars */
/* globals LANG */

const pluralMap = {
	1: 'one',
	// two, three, few, many, ...
};

//simple translation
const __ = (key) => {
	return LANG[key] || key;
};

//plurals+replace %s with count
const __n = (key, count) => {
	const pluralKey = pluralMap[count] || 'other';
	const translationObj = LANG[key];
	if (!translationObj) {
		return key;
	}
	const translationPlural = translationObj[pluralKey] || translationObj['other'];
	return translationPlural.replace('%s', count);
};
