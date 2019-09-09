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

	const buildTasks = require(__dirname+'/helpers/build.js')
		, generateQueue = new Queue('generate', { 'redis': configs.redis });

	generateQueue
		.on('error', console.error)
		.on('failed', console.warn);

	generateQueue.process(async job => {
		return buildTasks[job.data.task](job.data.options);
	});

})();


