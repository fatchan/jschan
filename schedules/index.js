'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const timeUtils = require(__dirname+'/../helpers/timeutils.js')
	, Mongo = require(__dirname+'/../db/db.js')
	, { pruneImmediately, debugLogs, enableWebring } = require(__dirname+'/../configs/main.js')
	, doInterval = require(__dirname+'/../helpers/dointerval.js');

(async () => {

	debugLogs && console.log('CONNECTING TO MONGODB');
	await Mongo.connect();
	debugLogs && console.log('STARTING SCHEDULES');

	//update board stats and homepage
	const taskQueue = require(__dirname+'/../queue.js');
	taskQueue.push({
		'task': 'updateStats',
		'options': {}
	}, {
		'repeat': {
			'cron': '0 * * * *'
		}
	});

	//delete files for expired captchas
	const deleteCaptchas = require(__dirname+'/deletecaptchas.js');
	doInterval(deleteCaptchas, timeUtils.MINUTE*5, true);

	//file pruning
	if (!pruneImmediately) {
		const pruneFiles = require(__dirname+'/prune.js');
		doInterval(pruneFiles, timeUtils.DAY, true);
	}

	//update the webring
	if (enableWebring) {
		const updateWebring = require(__dirname+'/webring.js');
		doInterval(updateWebring, timeUtils.MINUTE*15, true);
	}

})();
