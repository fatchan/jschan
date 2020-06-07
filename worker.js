'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const { debugLogs } = require(__dirname+'/configs/main.js')
	, Mongo = require(__dirname+'/db/db.js');

(async () => {

	debugLogs && console.log('CONNECTING TO MONGODB');
	await Mongo.connect();
	await Mongo.checkVersion();

	const tasks = require(__dirname+'/helpers/tasks.js')
		, { queue } = require(__dirname+'/queue.js')

	queue
		.on('error', console.error)
		.on('failed', console.warn);

	queue.process(async job => {
		await tasks[job.data.task](job.data.options);
		return null;
	});

})();


