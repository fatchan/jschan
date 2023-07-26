'use strict';

const { randomBytes } = require('crypto')
	, cache = require(__dirname+'/../../lib/redis/redis.js');

module.exports = async (req, res) => {

	const address = req.params.address;
	const newNonce = (await randomBytes(32)).toString('base64');
	await cache.set(`nonce:${address}:${newNonce}`, 1, 60);

	res.json({
		nonce: newNonce,
	});

};
