'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const Queue = require('bull')
	, { redis, debugLogs } = require(__dirname+'/configs/main.js')
	, Mongo = require(__dirname+'/db/db.js');

(async () => {

	debugLogs && console.log('CONNECTING TO MONGODB');
	await Mongo.connect();

	const tasks = require(__dirname+'/helpers/tasks.js')
		, taskQueue = new Queue('task', { redis });

	taskQueue
		.on('error', console.error)
		.on('failed', console.warn);

	taskQueue.process(async job => {
		await tasks[job.data.task](job.data.options);
		return null;
	});

})();


