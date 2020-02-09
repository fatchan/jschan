'use strict';

const Mongo = require(__dirname+'/db.js')
	, { blockBypass } = require(__dirname+'/../configs/main.js')
	, db = Mongo.client.db('jschan').collection('bypass');

module.exports = {

	db,

	checkBypass: (id) => {
		return db.findOneAndUpdate({
			'_id': id,
			'uses': {
				'$lte': blockBypass.expireAfterUses
			}
		}, {
			'$inc': {
				'uses': 1,
			}
		}).then(r => r.value);
	},

	getBypass: () => {
		return db.insertOne({
			'uses': 0,
			'expireAt': new Date(Date.now() + blockBypass.expireAfterTime)
		}).then(r => { return r.insertedId });
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

}
