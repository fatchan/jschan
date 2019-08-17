
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

	findMany: (board, ids) => {
		return db.find({
			'_id': {
				'$in': ids
			},
			'board': board
		}).toArray();
	},

	getAllBans: () => {
		return db.find({}).toArray();
	},

	getGlobalBans: () => {
		return db.find({
			'board': null
		}).toArray();
	},

	getBoardBans: (board) => {
		return db.find({
			'board': board,
		}).toArray();
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
