'use strict';

const escapeRegExp = require(__dirname+'/escaperegexp.js')
	, { isIP } = require('net')
	, { ipHashPermLevel } = require(__dirname+'/../configs/main.js')

module.exports = (query, permLevel) => {
	if (query.ip && typeof query.ip === 'string') {
		const decoded = decodeURIComponent(query.ip);
		if (permLevel <= ipHashPermLevel && (isIP(decoded) || decoded.match(/[a-z0-9]{24}/i))) { //if perms to view raw ip or bypass, allow querying
			return decoded;
		} else if (decoded.length === 10) { //otherwise, only allow last 10 char substring
			return new RegExp(`${escapeRegExp(decoded)}$`);
		}
	}
	return null; //else, no ip filter
}
