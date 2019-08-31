'use strict';

const Redis = require('ioredis')
	, configs = require(__dirname+'/configs/main.json')
	, client = new Redis(configs.redis);

module.exports = {

	redisClient: client,

	//get a value with key
	get: async (key) => {
		return client.get(key).then(res => {
			return JSON.parse(res);
		});
	},

	//set a value on key
	set: (key, value) => {
		return client.set(key, JSON.stringify(value));
	},

	//add items to a set
	sadd: (key, value) => {
		return client.sadd(key, value);
	},

	//get random item from set
	srand: (key) => {
		return client.srandmember(key);
	},

	//delete value with key
	del: (key) => {
		return client.del(key);
	},

}
