'use strict';

const Queue = require('bull')
	, configs = require(__dirname+'/configs/main.js')
	, taskQueue = new Queue('task', { 'redis': configs.redis });

module.exports = {

	queue: taskQueue,

	push: (data, options={removeOnComplete: true}) => {
		taskQueue.add(data, options);
	}

}
