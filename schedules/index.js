'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const Mongo = require(__dirname+'/../db/db.js')
	, config = require(__dirname+'/../config.js')
	, { addCallback } = require(__dirname+'/../redis.js');

(async () => {

	await Mongo.connect();
	await Mongo.checkVersion();
	await config.load();

	//start all the scheduled tasks
	const schedules = require(__dirname+'/tasks/index.js');

	//update the schedules to start/stop timer after config change
	addCallback('config', () => {
		Object.values(schedules).forEach(sc => {
			sc.update();
		});
	})

	//update board stats and homepage task, use cron and bull for proper timing
	require(__dirname+'/../queue.js').push({
		'task': 'updateStats',
		'options': {}
	}, {
		'repeat': {
			'cron': '0 * * * *'
		}
	});

})();
