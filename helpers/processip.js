'use strict';

const { ipHeader, ipHashPermLevel } = require(__dirname+'/../configs/main.js')
	, { isIP } = require('net')
	, hashIp = require(__dirname+'/haship.js');

module.exports = (req, res, next) => {
	const ip = req.headers[ipHeader] || req.connection.remoteAddress;
	const ipVersion = isIP(ip);
	if (ipVersion) {
		const delimiter = ipVersion === 4 ? '.' : ':';
		let split = ip.split(delimiter);
		const qrange = split.slice(0,Math.floor(split.length*0.75)).join(delimiter);
		const hrange = split.slice(0,Math.floor(split.length*0.5)).join(delimiter);
		res.locals.ip = {
			raw: ipHashPermLevel === -1 ? hashIp(ip) : ip,
			single: hashIp(ip),
			qrange: hashIp(qrange),
			hrange: hashIp(hrange),
		}
		next();
	} else {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'message': 'Malformed IP' //should never get here
		});
	}
}
