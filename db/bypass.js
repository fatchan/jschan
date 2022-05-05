'use strict';

const Mongo = require(__dirname+'/db.js')
	, config = require(__dirname+'/../lib/misc/config.js')
	, db = Mongo.db.collection('bypass');

module.exports = {

	db,

	checkBypass: (id, anonymizer=false) => {
		const { blockBypass } = config.get;
		return db.findOneAndUpdate({
			'_id': id,
			'anonymizer': anonymizer,
			'uses': {
				'$lte': blockBypass.expireAfterUses
			}
		}, {
			'$inc': {
				'uses': 1,
			}
		}).then(r => r.value);
	},

	getBypass: (anonymizer=false) => {
		const { blockBypass } = config.get;
		return db.insertOne({
			'uses': 0,
			'anonymizer': anonymizer,
			'expireAt': new Date(Date.now() + blockBypass.expireAfterTime)
		});
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

};
