'use strict';

const Queue = require('bull')
	, configs = require(__dirname+'/configs/main.js')
	, taskQueue = new Queue('task', { 'redis': configs.redis });

module.exports = {

	queue: taskQueue,

	push: (data) => {
		taskQueue.add(data, { removeOnComplete: true });
	}

}
