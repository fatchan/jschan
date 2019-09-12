'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const msTime = require(__dirname+'/helpers/mstime.js')
	, Mongo = require(__dirname+'/db/db.js')
	, { enableWebring } = require(__dirname+'/configs/main.json')
	, buildQueue = require(__dirname+'/queue.js');

(async () => {

	console.log('CONNECTING TO MONGODB');
	await Mongo.connect();
	console.log('STARTING SCHEDULES');

	//add 5 minute repeatable job to queue (queue will prevent duplicate)
	buildQueue.push({
		'task': 'buildHomepage',
		'options': {}
	}, {
		'repeat': {
			'cron': '*/5 * * * *'
		}
	});

	//delete files for expired captchas
	const deleteCaptchas = require(__dirname+'/helpers/captcha/deletecaptchas.js');
	deleteCaptchas().catch(e => console.error);
	setInterval(async () => {
		try {
			await deleteCaptchas();
		} catch (e) {
			console.error(e);
		}
	}, msTime.minute*5);

	//update webring
	if (enableWebring) {
		const updateWebring = require(__dirname+'/webring.js');
		updateWebring().catch(e => console.error);
		setInterval(async () => {
			try {
				await updateWebring();
			} catch (e) {
				console.error(e);
			}
		}, msTime.hour);
	}

	//file pruning
	const pruneFiles = require(__dirname+'/helpers/files/prune.js');
	pruneFiles().catch(e => console.error);
	setInterval(async () => {
		try {
			await pruneFiles();
		} catch (e) {
			console.error(e);
		}
	}, msTime.day);

})();
