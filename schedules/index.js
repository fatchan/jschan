'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const msTime = require(__dirname+'/../helpers/mstime.js')
	, Mongo = require(__dirname+'/../db/db.js')
	, { enableWebring } = require(__dirname+'/../configs/main.json')
	, doInterval = require(__dirname+'/../helpers/dointerval.js');

(async () => {

	console.log('CONNECTING TO MONGODB');
	await Mongo.connect();
	console.log('STARTING SCHEDULES');

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
	doInterval(deleteCaptchas, msTime.minute*5, true);

	//file pruning
	const pruneFiles = require(__dirname+'/prune.js');
	doInterval(pruneFiles, msTime.day, true);

	//update the webring
	if (enableWebring) {
		const updateWebring = require(__dirname+'/webring.js');
		doInterval(updateWebring, msTime.minute*30, true);
	}

})();
