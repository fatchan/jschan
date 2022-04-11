'use strict';

const { Accounts } = require(__dirname+'/../../db/')
	, redis = require(__dirname+'/../../lib/redis/redis.js');

module.exports = async (username) => {

	await Promise.all([
		Accounts.deleteOne(username),
		redis.deletePattern(`sess:*:${username}`),
	]);

}
