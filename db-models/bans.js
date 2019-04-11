'use strict';

const Mongo = require(__dirname+'/../helpers/db.js')
	, db = Mongo.client.db('jschan').collection('bans');

module.exports = {

	find: (ip, board) => {
		return db.find({
			'ip': ip,
			'board': {
				'$in': [board, null]
			}
		}).toArray();
	},

	insertOne: (ban) => {
		return db.insertOne(ban);
	},

	insertMany: (bans) => {
		return db.insertMany(bans);
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

}
