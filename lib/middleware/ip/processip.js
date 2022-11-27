'use strict';

const config = require(__dirname+'/../../misc/config.js')
	, { createCIDR, parse } = require('ip6addr')
	, hashIp = require(__dirname+'/../../misc/haship.js')
	, ipTypes = require(__dirname+'/iptypes.js')
	, { ObjectId } = require(__dirname+'/../../../db/db.js');

module.exports = (req, res, next) => {

	//tor user ip uses bypass id (or objectid, which will become bypassid)
	if (res.locals.anonymizer) {
		const pseudoIp = req.signedCookies.bypassid || ObjectId().toString();
		res.locals.pseudoIp = pseudoIp;
		res.locals.ip = {
			raw: `${pseudoIp}.BP`,
			cloak: `${pseudoIp}.BP`,
			type: ipTypes.BYPASS,
		};
		return next();
	}

	//ip for normal user
	const { dontStoreRawIps, ipHeader } = config.get;
	const ip = req.headers[ipHeader] || req.connection.remoteAddress;
	try {
		const ipParsed = parse(ip);
		const ipKind = ipParsed.kind();
		const ipStr = ipParsed.toString({
			format: ipKind === 'ipv4' ? 'v4' : 'v6',
			zeroElide: false,
			zeroPad: false,
		});
		let qrange
			, hrange
			, type;
		if (ipKind === 'ipv4') {
			qrange = createCIDR(ipStr, 24).toString();
			hrange = createCIDR(ipStr, 16).toString();
			type = ipTypes.IPV4;
		} else {
			qrange = createCIDR(ipStr, 64).toString();
			hrange = createCIDR(ipStr, 48).toString();
			type = ipTypes.IPV6;
		}
		const cloak = `${hashIp(hrange).substring(0,8)}.${hashIp(qrange).substring(0,7)}.${hashIp(ipStr).substring(0,7)}.IP${ipKind.charAt(3)}`;
		res.locals.ip = {
			raw: dontStoreRawIps === true ? cloak : ipStr,
			cloak,
			type,
		};
		next();
	} catch(e)  {
		console.error('Ip parse failed', e);
		return res.status(400).render('message', {
			'title': 'Bad request',
			'message': 'Malformed IP' //should never get here
		});
	}

};
