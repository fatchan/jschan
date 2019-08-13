
'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('news');

module.exports = {

	find: () => {
		return db.find({}).sort({
			'_id': -1
		}).toArray();
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
