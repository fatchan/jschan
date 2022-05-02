'use strict';

const Queue = require('bull')
	, { redis } = require(__dirname+'/../../configs/secrets.js')
	, taskQueue = new Queue('task', { redis });

module.exports = {

	queue: taskQueue,

	push: (data, options) => {
		taskQueue.add(data, { ...options, removeOnComplete: true});
	}

};
