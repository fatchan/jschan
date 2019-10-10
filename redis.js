'use strict';

const Redis = require('ioredis')
	, configs = require(__dirname+'/configs/main.json')
	, client = new Redis(configs.redis);

module.exports = {

	redisClient: client,

	//get a value with key
	get: (key) => {
		return client.get(key).then(res => { return JSON.parse(res) });
	},

	//set a value on key
	set: (key, value, ttl) => {
		if (ttl) {
			client.set(key, JSON.stringify(value), 'EX', ttl);
		} else {
			client.set(key, JSON.stringify(value));
		}
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

	deletePattern: (pattern) => {
		return new Promise((resolve, reject) => {
			const stream = client.scanStream({
				match: pattern
			});
			stream.on('data', (keys) => {
				if (keys.length > 0) {
					const pipeline = client.pipeline();
					for (let i = 0; i < keys.length; i++) {
						pipeline.del(keys[i]);
					}
					pipeline.exec();
				}
			});
			stream.on('end', () => {
				resolve();
			});
			stream.on('error', (err) => {
				reject(err);
			});
		});
	},

}
