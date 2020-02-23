'use strict';

const escapeRegExp = require(__dirname+'/escaperegexp.js')
	, { ipHashMode } = require(__dirname+'/../configs/main.js')

module.exports = (query, permLevel) => {
	if (query.ip) {
		const decoded = decodeURIComponent(query.ip);
		const hashed = ipHashMode === 2 || (ipHashMode === 1 && permLevel > 1)
		if (!hashed || decoded.length === 10) {
			return new RegExp(`${escapeRegExp(decoded)}$`);
		}
	}
	return null;
}
