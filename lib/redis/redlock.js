'use strict';

const Redlock = require('redlock')
	, { redisClient } = require(__dirname+'/redis.js')
	, redlock = new Redlock([redisClient]);

redlock.on('clientError', console.error);

module.exports = redlock;
