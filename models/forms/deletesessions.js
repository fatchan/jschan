'use strict';

const redis = require(__dirname+'/../../redis.js');

module.exports = async (sessionIds) => {

	await redis.del(sessionIds);

}
