const RedisSMQ = require('rsmq')
	, { redisClient } = require(__dirname+'/redis.js')
	, rsmq = new RedisSMQ({ ns: 'rsmq', client: redisClient })
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
