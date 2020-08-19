'use strict';

const cache = require(__dirname+'/../redis.js')
	, dynamicResponse = require(__dirname+'/dynamic.js')
	, { ipHeader, dnsbl } = require(__dirname+'/../configs/main.js')
	, { isIP } = require('net')
	, { batch } = require('dnsbl');

module.exports = async (req, res, next) => {

	if (dnsbl.enabled && isIP(res.locals.ip.raw)) {
		const ip = res.locals.ip.raw;
		let isBlacklisted = await cache.get(`blacklisted:${ip}`);
		if (isBlacklisted === null) { //not cached
			const dnsblResp = await batch(ip, dnsbl.blacklists);
			isBlacklisted = dnsblResp.some(r => r.listed === true);
			await cache.set(`blacklisted:${ip}`, isBlacklisted, dnsbl.cacheTime);
		}
		if (isBlacklisted) {
			return dynamicResponse(req, res, 403, 'message', {
				'title': 'Forbidden',
				'message': 'Your IP address is listed on a blacklist',
				'redirect': req.headers.referer || '/'
			});
		}
	}
	return next();

}

