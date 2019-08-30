'use strict';

const Redis = require('ioredis')
	, configs = require(__dirname+'/configs/main.json')
	, redisClient = new Redis(configs.redis);

module.exports = {

	redisClient,

//cache not used yet, but will need to JSON stringify things that are objects e.g. boards, threads 
	get: async (key) => {
		return client.get(key);
	},

	set: (key, value) => {
		return client.set(key, value);
	},

}
