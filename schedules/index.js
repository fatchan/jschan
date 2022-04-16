'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const Mongo = require(__dirname+'/../db/db.js')
	, config = require(__dirname+'/../lib/misc/config.js')
	, { addCallback } = require(__dirname+'/../lib/redis/redis.js');

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
	require(__dirname+'/../lib/build/queue.js').push({
		'task': 'updateStats',
		'options': {}
	}, {
		'repeat': {
			'cron': '0 * * * *'
		}
	});

})();
