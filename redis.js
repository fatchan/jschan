'use strict';

const Redis = require('ioredis')
	, configs = require(__dirname+'/configs/main.js')
	, client = new Redis(configs.redis)
	, publisher = new Redis(configs.redis);

client.subscribe('config', (err, count) => {
	if (err) {
		return console.error(err);
	}
	console.log(`Redis subscribed to ${count} channels`);
});

client.on("message", (channel, message) => {
	switch (channel) {
		case 'config':
			//TODO: something, change the configs import to a new config handler class/module
			void 0;
			break;
		default:
			console.error(`Unhandled pubsub channel ${channel} message: ${message}`);
			break;
	}
});

module.exports = {

	redisClient: client,
	redisPublisher: publisher,

	//get a value with key
	get: (key) => {
		return client.get(key).then(res => { return JSON.parse(res) });
	},

	//set a value on key
	set: (key, value, ttl) => {
		if (ttl) {
			return client.set(key, JSON.stringify(value), 'EX', ttl);
		} else {
			return client.set(key, JSON.stringify(value));
		}
	},

	//set a value on key if not exist
	setnx: (key, value) => {
		return client.setnx(key, JSON.stringify(value));
	},

	//add items to a set
	sadd: (key, value) => {
		return client.sadd(key, value);
	},

	//get all members of a set
	sgetall: (key) => {
		return client.smembers(key);
	},

	//remove an item from a set
	srem: (key, value) => {
		return client.srem(key, value);
	},

	//get random item from set
	srand: (key) => {
		return client.srandmember(key);
	},

	//delete value with key
	del: (keyOrKeys) => {
		if (Array.isArray(keyOrKeys))	{
			return client.del(...keyOrKeys);
		} else {
			return client.del(keyOrKeys);
		}
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
