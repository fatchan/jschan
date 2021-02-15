'use strict';

const Mongo = require(__dirname+'/db.js')
	, config = require(__dirname+'/../config.js')
	, db = Mongo.db.collection('bypass');

module.exports = {

	db,

	checkBypass: (id) => {
		const { blockBypass } = config.get;
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
		const { blockBypass } = config.get;
		return db.insertOne({
			'uses': 0,
			'expireAt': new Date(Date.now() + blockBypass.expireAfterTime)
		});
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

}
