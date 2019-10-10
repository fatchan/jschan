'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const Queue = require('bull')
	, configs = require(__dirname+'/configs/main.json')
	, Mongo = require(__dirname+'/db/db.js');

(async () => {

	console.log('CONNECTING TO MONGODB');
	await Mongo.connect();

	const tasks = require(__dirname+'/helpers/tasks.js')
		, taskQueue = new Queue('task', { 'redis': configs.redis });

	taskQueue
		.on('error', console.error)
		.on('failed', console.warn);

	taskQueue.process(async job => {
		return tasks[job.data.task](job.data.options);
	});

})();


