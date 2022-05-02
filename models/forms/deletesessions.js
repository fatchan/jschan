'use strict';

const redis = require(__dirname+'/../../lib/redis/redis.js');

module.exports = async (sessionIds) => {

	await redis.del(sessionIds);

};
