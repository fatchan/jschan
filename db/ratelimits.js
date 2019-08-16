'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('ratelimit');

module.exports = {

	db,

	resetQuota: (ip) => {
		return db.deleteOne({ '_id': ip });
	},

	incrmentQuota: (ip, amount) => {
		return db.findOneAndUpdate(
			{
				'_id': ip
			},
			{
				'$inc': {
					'sequence_value': amount
				},
				'$setOnInsert': {
					'expireAt': new Date()
				}
			},
			{
				'upsert': true
			}
		).then(r => { return r.value ? r.value.sequence_value : 0 });
	},

	deleteAll: () => {
		return ratelimit.deleteMany({});
	},

}
