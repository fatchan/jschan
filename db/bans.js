
'use strict';

const Mongo = require(__dirname+'/../helpers/db.js')
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

	getAll: () => { // for a global ban manage page maybe? still TODO
		return db.find({}).toArray();
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
		})
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
