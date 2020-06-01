'use strict';

const escapeRegExp = require(__dirname+'/escaperegexp.js')
	, { ipHashPermLevel } = require(__dirname+'/../configs/main.js')

module.exports = (query, permLevel) => {
	if (query.ip && typeof query.ip === 'string') {
		const decoded = decodeURIComponent(query.ip);
		if (permLevel <= ipHashPermLevel) { //if perms to view raw ip, allow querying
			return { raw: decoded };
		} else if (decoded.length === 10) { //otherwise, only allow last 10 char substring
			return { single: new RegExp(`${escapeRegExp(decoded)}$`) };
		}
	}
	return null; //else, no ip filter
}
