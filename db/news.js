
'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.db.collection('news');

module.exports = {

	db,

	find: (limit=0) => {
		return db.find({}).sort({
			'_id': -1
		})
			.limit(limit)
			.toArray();
	},

	findOne: (id) => {
		return db.findOne({
			'_id': id,
		});
	},

	updateOne: (id, title, raw, markdown) => {
		return db.updateOne({
			'_id': id,
		}, {
			'$set': {
				'title': title,
				'message.raw': raw,
				'message.markdown': markdown,
				'edited': new Date(),
			}
		});
	},

	insertOne: (news) => {
		return db.insertOne(news);
	},

	deleteMany: (ids) => {
		return db.deleteMany({
			'_id': {
				'$in': ids
			}
		});
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

};
