const RedisSMQ = require('rsmq')
	, configs = require(__dirname+'/configs/main.json')
	, rsmq = new RedisSMQ({ host: '127.0.0.1', port: 6379, ns: 'rsmq', password: configs.redisPassword })
	, queuename = 'generate'

rsmq.createQueue({ qname: queuename }, (err) => {
	if (err && err.name !== 'queueExists') {
			return console.error(err);
	}
});

module.exports.push = (data) => {
	rsmq.sendMessage({ qname: queuename, message: JSON.stringify(data) }, (err) => {
		if (err) {
			return console.error(err);
		}
		//message enqueued successfully
	});
}

/*
//was testing
setInterval(() => {
	const data = {
		task: 'buildCatalog',
		options: {
			'board': 'b'
		}
	}
	module.exports.push(data);
}, 500);
*/
