'use strict';

const escapeRegExp = require(__dirname+'/escaperegexp.js')
	, { isIP } = require('net')
	, config = require(__dirname+'/../config.js')

module.exports = (query, permLevel) => {
	const { ipHashPermLevel } = config.get;
	if (query.ip && typeof query.ip === 'string') {
		const decoded = decodeURIComponent(query.ip);
		if (permLevel <= ipHashPermLevel || !isIP(decoded)) {
			//if they have perm to view raw IP, or its NOT a raw ip, return
			return decoded;
		}
	}
	return null; //else, no ip filter
}
