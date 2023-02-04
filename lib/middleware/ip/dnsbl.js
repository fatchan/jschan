'use strict';

const cache = require(__dirname+'/../../redis/redis.js')
	, { check: blockBypassCheck } = require(__dirname+'/../captcha/blockbypass.js')
	, dynamicResponse = require(__dirname+'/../../misc/dynamic.js')
	, deleteTempFiles = require(__dirname+'/../../file/deletetempfiles.js')
	, config = require(__dirname+'/../../misc/config.js')
	, { batch } = require('dnsbl');

module.exports = async (req, res, next) => {

	const { ipHeader, dnsbl, blockBypass } = config.get;

	if (dnsbl.enabled && dnsbl.blacklists.length > 0 //if dnsbl enabled and has more than 0 blacklists
		&& !res.locals.anonymizer) { //anonymizers cant be dnsbl'd
		const ip = req.headers[ipHeader] || req.connection.remoteAddress;
		let isBlacklisted = await cache.get(`blacklisted:${ip}`);
		if (isBlacklisted === null) { //not cached
			const dnsblResp = await batch(ip, dnsbl.blacklists);
			isBlacklisted = dnsblResp.some(r => r.listed === true);
			await cache.set(`blacklisted:${ip}`, isBlacklisted, Math.floor(dnsbl.cacheTime/1000));
		}
		if (isBlacklisted) {
			if (blockBypass.bypassDnsbl) {
				if (!res.locals.blockBypass) {
					return blockBypassCheck(req, res, next);
				}
				return next(); //already solved
			}
			//otherwise dnsbl cant be bypassed
			deleteTempFiles(req).catch(console.error);
			const { __ } = res.locals;
			return dynamicResponse(req, res, 403, 'message', {
				'title': __('Forbidden'),
				'message': __('Your request was blocked because your IP address is listed on a blacklist.'),
				'redirect': req.headers.referer || '/',
			});
		}
	}
	return next();

};

