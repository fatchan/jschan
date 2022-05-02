'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.db.collection('ratelimit');

module.exports = {

	db,

	resetQuota: (identifier, action) => {
		return db.deleteOne({ '_id': `${identifier}-${action}` });
	},

	incrmentQuota: (identifier, action, amount) => {
		return db.findOneAndUpdate(
			{
				'_id': `${identifier}-${action}`
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
		).then(r => { return r.value ? r.value.sequence_value : 0; });
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

};
