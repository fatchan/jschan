'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const msTime = require(__dirname+'/../helpers/mstime.js')
	, Mongo = require(__dirname+'/../db/db.js')
	, { enableWebring } = require(__dirname+'/../configs/main.json');

(async () => {

	console.log('CONNECTING TO MONGODB');
	await Mongo.connect();
	console.log('STARTING SCHEDULES');

	//delete files for expired captchas
	const deleteCaptchas = require(__dirname+'/deletecaptchas.js');
	deleteCaptchas().catch(e => console.error);
	setInterval(() => {
		deleteCaptchas().catch(e => console.error);
	}, msTime.minute*5);

	//update webring
	if (enableWebring) {
		const updateWebring = require(__dirname+'/webring.js');
		updateWebring().catch(e => console.error);
		setInterval(() => {
			updateWebring().catch(e => console.error);
		}, msTime.hour);
	}

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

	//file pruning
	const pruneFiles = require(__dirname+'/prune.js');
	pruneFiles().catch(e => console.error);
	setInterval(() => {
		pruneFiles().catch(e => console.error);
	}, msTime.day);

})();
