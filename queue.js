'use strict';

const Queue = require('bull')
	, configs = require(__dirname+'/configs/main.json')
	, taskQueue = new Queue('task', { 'redis': configs.redis });

module.exports = {

	queue: taskQueue,

	push: (data, options) => {
		taskQueue.add(data, options);
	}

}
