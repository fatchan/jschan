'use strict';

const Redis = require('ioredis')
	, configs = require(__dirname+'/configs/main.js')
	, sharedClient = new Redis(configs.redis)
	, subscriber = new Redis(configs.redis)
	, publisher = new Redis(configs.redis)
	, messageCallbacks = {
		'config': [], //others in future?
	}

subscriber.subscribe('config', (err, count) => {
	if (err) {
		return console.error(err);
	}
	console.log(`Redis subscribed to ${count} channels`);
});

subscriber.on("message", (channel, message) => {
	messageCallbacks[channel].forEach(cb => {
		cb(message);
	})
});

module.exports = {

	redisClient: sharedClient,
	redisSubsriber: subscriber,
	redisPublisher: publisher,

	addCallback: (channel, cb) => {
		messageCallbacks[channel].push(cb);
	},

	//get a value with key
	get: (key) => {
		return sharedClient.get(key).then(res => { return JSON.parse(res) });
	},

	//set a value on key
	set: (key, value, ttl) => {
		if (ttl) {
			return sharedClient.set(key, JSON.stringify(value), 'EX', ttl);
		} else {
			return sharedClient.set(key, JSON.stringify(value));
		}
	},

	//set a value on key if not exist
	setnx: (key, value) => {
		return sharedClient.setnx(key, JSON.stringify(value));
	},

	//add items to a set
	sadd: (key, value) => {
		return sharedClient.sadd(key, value);
	},

	//get all members of a set
	sgetall: (key) => {
		return sharedClient.smembers(key);
	},

	//remove an item from a set
	srem: (key, value) => {
		return sharedClient.srem(key, value);
	},

	//get random item from set
	srand: (key) => {
		return sharedClient.srandmember(key);
	},

	//delete value with key
	del: (keyOrKeys) => {
		if (Array.isArray(keyOrKeys))	{
			return sharedClient.del(...keyOrKeys);
		} else {
			return sharedClient.del(keyOrKeys);
		}
	},

	deletePattern: (pattern) => {
		return new Promise((resolve, reject) => {
			const stream = sharedClient.scanStream({
				match: pattern
			});
			stream.on('data', (keys) => {
				if (keys.length > 0) {
					const pipeline = sharedClient.pipeline();
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
