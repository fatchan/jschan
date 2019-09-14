'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const msTime = require(__dirname+'/helpers/mstime.js')
	, Mongo = require(__dirname+'/db/db.js')
	, { enableWebring } = require(__dirname+'/configs/main.json');

(async () => {

	console.log('CONNECTING TO MONGODB');
	await Mongo.connect();
	console.log('STARTING SCHEDULES');

	//delete files for expired captchas
	const deleteCaptchas = require(__dirname+'/schedules/deletecaptchas.js');
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
		const updateWebring = require(__dirname+'/schedules/webring.js');
		updateWebring().catch(e => console.error);
		setInterval(async () => {
			try {
				await updateWebring();
			} catch (e) {
				console.error(e);
			}
		}, msTime.day);
	}

	//update board stats
	const { Stats } = require(__dirname+'/db/');
	await Stats.updateBoards().catch(e => console.error);
	setTimeout(() => {
		setInterval(async () => {
			try {
				await Stats.updateBoards();
				await Stats.resetPph();
	            await Stats.resetIps();
			} catch (e) {
				console.error(e);
			}
		}, msTime.hour);
	}, msTime.nextHour()); //wait until start of hour

	//file pruning
	const pruneFiles = require(__dirname+'/schedules/prune.js');
	pruneFiles().catch(e => console.error);
	setInterval(async () => {
		try {
			await pruneFiles();
		} catch (e) {
			console.error(e);
		}
	}, msTime.day);

})();
