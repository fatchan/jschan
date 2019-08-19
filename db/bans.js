
'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('bans');

module.exports = {

	db,

	find: (ip, board) => {
		return db.find({
			'ip': ip,
			'board': {
				'$in': [board, null]
			}
		}).toArray();
	},

	appeal: (ip, ids, appeal) => {
		return db.updateMany({
			'_id': {
				'$in': ids
			},
			'ip': ip,
			'allowAppeal': true,
            'appeal': null
		}, {
			'$set': {
				'appeal': appeal,
			}
		});
	},

	getGlobalBans: () => {
		return db.find({
			'board': null
		}).sort({ _id: -1 }).toArray();
	},

	getBoardBans: (board) => {
		return db.find({
			'board': board,
		}).sort({ _id: -1 }).toArray();
	},

	removeMany: (board, ids) => {
		return db.deleteMany({
			'board': board,
			'_id': {
				'$in': ids
			}
		});
	},

	deleteBoard: (board) => {
		return db.deleteMany({
			'board': board
		});
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
