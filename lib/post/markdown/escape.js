'use strict';

const entities = {
	"'": '&#39;',
	'/': '&#x2F;',
	'`': '&#x60;',
	'=': '&#x3D;',
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;'
}

module.exports = (string) => {
	return string.replace(/[&<>"'`=\/]/g, s => entities[s]);
}
