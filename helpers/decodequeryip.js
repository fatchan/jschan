'use strict';

const escapeRegExp = require(__dirname+'/escaperegexp.js')
	, { ipHashPermLevel } = require(__dirname+'/../configs/main.js')

module.exports = (query, permLevel) => {
	if (query.ip && typeof query.ip === 'string') {
		const decoded = decodeURIComponent(query.ip);
		const hashed = permLevel > ipHashPermLevel;
		if (!hashed || decoded.length === 10) {
			return new RegExp(`${escapeRegExp(decoded)}$`);
		}
	}
	return null;
}
