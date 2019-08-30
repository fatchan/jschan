'use strict';

const Redis = require('ioredis')
	, configs = require(__dirname+'/configs/main.json')
	, client = new Redis(configs.redis);

module.exports = {

	redisClient: client,

//cache not used yet, but will need to JSON stringify things that are objects e.g. boards, threads 
	get: async (key) => {
		return client.get(key).then(res => {
			return JSON.parse(res);
		});
	},

	set: (key, value) => {
		return client.set(key, JSON.stringify(value));
	},

	del: (key) => {
		return client.del(key);
	},

}
