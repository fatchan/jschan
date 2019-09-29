'use strict';

const { ipHashSecret } = require(__dirname+'/../configs/main.json')
    , { createHash } = require('crypto');

module.exports = (req, res, next) => {
	const ip = req.headers['x-real-ip']; //need to consider forwarded-for, etc here and in nginx
	const split = ip.split('.');
	res.locals.ip = {
		hash: createHash('sha256').update(ipHashSecret + ip).digest('base64'),
		qrange: createHash('sha256').update(ipHashSecret + split.slice(0,3).join('.')).digest('base64'),
		hrange: createHash('sha256').update(ipHashSecret + split.slice(0,2).join('.')).digest('base64'),
	}
	next();
}
