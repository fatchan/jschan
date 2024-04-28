'use strict';

const Redis = require('ioredis')
	, { redis, debugLogs } = require(__dirname+'/../../configs/secrets.js')
	, sharedClient = new Redis(redis)
	, subscriber = new Redis(redis)
	, publisher = new Redis(redis)
	, messageCallbacks = {
		'config': [],
		'roles': [],
	};

module.exports = {

	redisClient: sharedClient,
	redisSubscriber: subscriber,
	redisPublisher: publisher,

	close: () => {
		sharedClient.quit();
		publisher.quit();
		subscriber.quit();
	},

	addCallback: (channel, cb) => {
		if (messageCallbacks[channel].length === 0) {
			subscriber.subscribe('config', (err) => {
				if (err) {
					return console.error(err);
				}
			});
			subscriber.subscribe('roles', (err) => {
				if (err) {
					return console.error(err);
				}
			});
			subscriber.on('message', (channel, message) => {
				debugLogs && console.log(`Subscriber message from channel ${channel}`);
				let data;
				if (message) {
					data = JSON.parse(message);
				}
				messageCallbacks[channel].forEach(cb => {
					cb(data);
				});
			});
		}
		messageCallbacks[channel].push(cb);
	},

	//get a value with key
	get: (key) => {
		return sharedClient.get(key).then(res => { return JSON.parse(res); });
	},

	//set a value on key
	set: (key, value, ttl) => {
		if (ttl) {
			return sharedClient.set(key, JSON.stringify(value), 'EX', ttl);
		} else {
			return sharedClient.set(key, JSON.stringify(value));
		}
	},

	incr: (key) => {
		return sharedClient.incr(key);
	},

	expire: (key, ttl) => {
		return sharedClient.expire(key, ttl);
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

	//remove item from a set
	srem: (key, values) => {
		return sharedClient.srem(key, values);
	},

	//get random item from set
	srand: (key) => {
		return sharedClient.srandmember(key);
	},

	//delete value with key
	del: (keyOrKeys) => {
		debugLogs && console.log('redis del():', keyOrKeys);
		if (Array.isArray(keyOrKeys)) {
			return sharedClient.del(...keyOrKeys);
		} else {
			return sharedClient.del(keyOrKeys);
		}
	},

	getPattern: (pattern) => {
		return new Promise((resolve, reject) => {
			const stream = sharedClient.scanStream({
				match: pattern
			});
			let allKeys = [];
			stream.on('data', (keys) => {
				allKeys = allKeys.concat(keys);
			});
			stream.on('end', async () => {
				const pipeline = sharedClient.pipeline();
				for (let i = 0; i < allKeys.length; i++) {
					pipeline.get(allKeys[i]);
				}
				let results;
				try {
					results = await pipeline.exec();
				} catch (e) {
					return reject(e);
				}
				const data = {};
				for (let i = 0; i < results.length; i++) {
					data[allKeys[i]] = JSON.parse(results[i][1]);
				}
				resolve(data);
			});
			stream.on('error', (err) => {
				reject(err);
			});
		});
	},

	deletePattern: (pattern) => {
		return new Promise((resolve, reject) => {
			let totalDeleted = 0;
			const stream = sharedClient.scanStream({
				match: pattern
			});
			stream.on('data', (keys) => {
				if (keys.length > 0) {
					totalDeleted += keys.length;
					const pipeline = sharedClient.pipeline();
					for (let i = 0; i < keys.length; i++) {
						pipeline.del(keys[i]);
					}
					pipeline.exec();
				}
			});
			stream.on('end', () => {
				resolve(totalDeleted);
			});
			stream.on('error', (err) => {
				reject(err);
			});
		});
	},

};
