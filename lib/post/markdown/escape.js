'use strict';

const entities = {
	'\'': '&#39;',
	'/': '&#x2F;',
	'`': '&#x60;',
	'=': '&#x3D;',
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;'
};

module.exports = (string) => {
	/* eslint-disable no-useless-escape */
	return string.replace(/[&<>"'`=\/]/g, s => entities[s]);
};
