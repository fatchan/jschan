'use strict';

const Mongo = require(__dirname+'/db.js')
	, config = require(__dirname+'/../lib/misc/config.js')
	, db = Mongo.db.collection('bypass');

module.exports = {

	db,

	checkBypass: (id, anonymizer=false) => {
		return db.findOneAndUpdate({
			'_id': id,
			'anonymizer': anonymizer,
			'uses': {
				'$gt': 0
			}
		}, {
			'$inc': {
				'uses': -1,
			}
		}).then(r => r.value);
	},

	getBypass: (anonymizer=false, id=null, uses=0) => {
		const { blockBypass } = config.get;
		const newBypass = {
			'uses': uses,
			'anonymizer': anonymizer,
			'expireAt': new Date(Date.now() + blockBypass.expireAfterTime)
		};
		if (anonymizer === true && id !== null) {
			newBypass._id = Mongo.ObjectId(id);
		}
		return db.insertOne(newBypass);		
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

};
