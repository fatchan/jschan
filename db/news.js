
'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('news');

module.exports = {

	db,

	find: (limit=0) => {
		return db.find({}).sort({
			'_id': -1
		})
		.limit(limit)
		.toArray();
	},

	insertOne: (news) => {
		return db.insertOne(news);
	},

	deleteMany: (ids) => {
		return db.deleteMany({
			'_id': {
				'$in': ids
			}
		})
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

}
