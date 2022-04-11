'use strict';

const config = require(__dirname+'/../config.js')
	, { createCIDR, parse } = require('ip6addr')
	, deleteTempFiles = require(__dirname+'/files/deletetempfiles.js')
	, dynamicResponse = require(__dirname+'/dynamic.js')
	, hashIp = require(__dirname+'/haship.js');

module.exports = (req, res, next) => {

	//tor user ip uses bypass id, if they dont have one send to blockbypass
	if (res.locals.anonymizer) {
		const pseudoIp = res.locals.preFetchedBypassId || req.signedCookies.bypassid;
		res.locals.ip = {
			raw: `${pseudoIp}.BP`,
			cloak: `${pseudoIp}.BP`,
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
			, hrange;
		if (ipKind === 'ipv4') {
			qrange = createCIDR(ipStr, 24).toString();
			hrange = createCIDR(ipStr, 16).toString();
		} else {
			qrange = createCIDR(ipStr, 64).toString();
			hrange = createCIDR(ipStr, 48).toString();
		}
		const cloak = `${hashIp(hrange).substring(0,8)}.${hashIp(qrange).substring(0,7)}.${hashIp(ipStr).substring(0,7)}.IP`;
		res.locals.ip = {
			raw: dontStoreRawIps === true ? cloak : ipStr,
			cloak,
		}
		//#426
		//console.log(`net-${hashIp(hrange).substring(0,6)}.${hashIp(qrange).substring(0,4)}.${hashIp(ipStr).substring(0,4)}.IP`)
		next();
	} catch(e)  {
		console.error('Ip parse failed', e);
		return res.status(400).render('message', {
			'title': 'Bad request',
			'message': 'Malformed IP' //should never get here
		});
	}

}
