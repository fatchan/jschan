/* eslint-disable no-unused-vars */
/* globals TRANSLATIONS */

const pluralMap = {
	1: 'one',
	// two, three, few, many, ...
};

//simple translation
const __ = (key, replacement=null) => {
	const translation = TRANSLATIONS[key] || key;
	return replacement !== null ? translation.replace('%s', replacement) : translation;
};

//pluralisation
const __n = (key, count) => {
	const pluralKey = pluralMap[count] || 'other';
	const translationObj = TRANSLATIONS[key];
	if (!translationObj) {
		return key;
	}
	const translationPlural = translationObj[pluralKey] || translationObj['other'];
	return translationPlural.replace('%s', count);
};
