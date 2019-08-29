'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const RedisSMQ = require('rsmq')
	, configs = require(__dirname+'/configs/main.json')
	, rsmq = new RedisSMQ({ host: '127.0.0.1', port: 6379, ns: 'rsmq', password: configs.redisPassword })
	, queuename = 'generate'
	, Mongo = require(__dirname+'/db/db.js')
	, Mutex = require(__dirname+'/mutex.js');

let buildTasks = {}
	, interval = 100;

(async () => {

	await Mongo.connect();
	await Mutex.connect();
	buildTasks = require(__dirname+'/helpers/build.js');

	rsmq.createQueue({ qname: queuename }, (err) => {
		if (err && err.name !== 'queueExists') {
				return console.error(err);
		}
		setTimeout(processQueueLoop, interval);
	});

})();


function processQueueLoop() {
	rsmq.receiveMessage({ qname: queuename }, async (err, resp) => {
		if (err) {
			return console.error(err);
		}
		if (resp.id) {
			interval = 100; //keeps queue checking fast when there are tasks
			const message = JSON.parse(resp.message);
			await buildTasks[message.task](message.options);
			rsmq.deleteMessage({ qname: queuename, id: resp.id }, (err) => {
				if (err) {
					return console.error(err);
				}
				//message deleted successfully
			});
		} else {
			//max 2 sec poll time
			if (interval < 2000) { //slow down queue when empty
				interval += 100;
			}
		}
		setTimeout(processQueueLoop, interval);
	});
}
