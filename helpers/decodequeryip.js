'use strict';

const escapeRegExp = require(__dirname+'/escaperegexp.js')
	, { isIP } = require('net')
	, Permissions = require(__dirname+'/permissions.js');

module.exports = (query, permissions) => {
	if (query.ip && typeof query.ip === 'string') {
		const decoded = decodeURIComponent(query.ip);
		if (permissions.get(Permissions.VIEW_RAW_IP) //allow raw ip query, if has perms to view raw ip
			&& (isIP(decoded) || decoded.match(/[a-z0-9]{24}/i))) { //and is ip or bypass
			return decoded;
		} else if (decoded.length === 10) { //otherwise, only allow last 10 char substring
			return new RegExp(`${escapeRegExp(decoded)}$`);
		}
	}
	return null; //else, no ip filter
}
