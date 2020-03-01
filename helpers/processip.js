'use strict';

const { ipHashMode } = require(__dirname+'/../configs/main.js')
	, { isIP } = require('net')
	, hashIp = require(__dirname+'/haship.js');

module.exports = (req, res, next) => {
	const ip = req.headers['x-real-ip'] || req.connection.remoteAddress; //need to consider forwarded-for, etc here and in nginx
	const ipVersion = isIP(ip);
	if (ipVersion) {
		const delimiter = ipVersion === 4 ? '.' : ':';
		let split = ip.split(delimiter);
		const qrange = split.slice(0,Math.floor(split.length*0.75)).join(delimiter);
		const hrange = split.slice(0,Math.floor(split.length*0.5)).join(delimiter);
		res.locals.ip = {
			single: ipHashMode === 2 ? hashIp(ip) : ip,
			qrange: ipHashMode === 2 ? hashIp(qrange) : qrange,
			hrange: ipHashMode === 2 ? hashIp(hrange) : hrange,
		}
		next();
	} else {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'message': 'Malformed IP' //should never get here
		});
	}
}
