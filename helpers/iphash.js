'use strict';

const configs = require(__dirname+'/../configs/main.json')
    , { createHash } = require('crypto');

module.exports = (req, res, next) => {
	const ip = req.headers['x-real-ip']; //need to consider forwarded-for, etc here and in nginx
	res.locals.ip = createHash('sha256').update(configs.ipHashSecret + ip).digest('base64');
	next();
}
