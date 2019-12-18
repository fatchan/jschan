'use strict';

const  escapeRegExp = require(__dirname+'/escaperegexp.js')

module.exports = (query) => {
	if (query.ip) {
		const decoded = decodeURIComponent(query.ip);
		if (decoded.length === 10) {
			return new RegExp(`${escapeRegExp(decoded)}$`);
		}
	}
	return null;
}
