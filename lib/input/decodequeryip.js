'use strict';

const { isIP } = require('net')
	, { Permissions } = require(__dirname+'/../permission/permissions.js');

module.exports = (query, permissions) => {
	if (query && query.ip && typeof query.ip === 'string') {
		const decoded = decodeURIComponent(query.ip);
		//if is IP but no permission, return null
		if (isIP(decoded) && !permissions.get(Permissions.VIEW_RAW_IP)) {
			return null;
		}
		return decoded; //otherwise return ip/cloak query
	}
	return null; //else, no ip filter
};
