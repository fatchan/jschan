'use strict';

const config = require(__dirname+'/../../misc/config.js')
	, dynamicResponse = require(__dirname+'/../../misc/dynamic.js')
	, { addCallback } = require(__dirname+'/../../redis/redis.js');

let refererCheck, allowedHosts, allowedHostSet;
const updateReferers = () => {
	({ refererCheck, allowedHosts } = config.get);
	allowedHostSet = new Set(allowedHosts);
};
updateReferers();
addCallback('config', updateReferers);

module.exports = (req, res, next) => {
	if (req.method !== 'POST') {
		return next();
	}
	let validReferer = false;
	try {
		const url = new URL(req.headers.referer);
		validReferer = allowedHostSet.has(url.hostname);
	} catch(e) {
		//referrer is invalid url
	}
	if (refererCheck === true && (!req.headers.referer || !validReferer)) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Invalid or missing "Referer" header. Are you posting from the correct URL?'
		});
	}
	next();
};
