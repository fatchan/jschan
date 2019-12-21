'use strict';

const { ipHashSecret } = require(__dirname+'/../configs/main.js')
	, { isIP } = require('net')
	, { createHash } = require('crypto');

module.exports = (req, res, next) => {

	const ip = req.headers['x-real-ip'] || req.connection.remoteAddress; //need to consider forwarded-for, etc here and in nginx
	const ipVersion = isIP(ip);
	if (ipVersion) {
		const delimiter = ipVersion === 4 ? '.' : ':';
		let split = ip.split(delimiter);
		res.locals.ip = {
			hash: createHash('sha256').update(ipHashSecret + ip).digest('base64'),
			qrange: createHash('sha256').update(ipHashSecret + split.slice(0,Math.floor(split.length*0.75)).join(delimiter)).digest('base64'),
			hrange: createHash('sha256').update(ipHashSecret + split.slice(0,Math.floor(split.length*0.5)).join(delimiter)).digest('base64'),
		}
		next();
	} else {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'message': 'Malformed IP' //should never get here
		});
	}
}
