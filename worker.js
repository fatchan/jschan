'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const Mongo = require(__dirname+'/db/db.js')
	, config = require(__dirname+'/lib/misc/config.js');

(async () => {

	await Mongo.connect();
	await Mongo.checkVersion();
	await config.load();

	const tasks = require(__dirname+'/lib/build/tasks.js')
		, { queue } = require(__dirname+'/lib/build/queue.js');

	queue
		.on('error', console.error)
		.on('failed', console.warn);

	queue.process(async job => {
		await tasks[job.data.task](job.data.options);
		return null;
	});

})();

