
'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.db.collection('custompages');

module.exports = {

	db,

	find: (board, limit=0) => {
		return db.find({
			'board': board
		}).sort({
			'_id': -1
		})
		.limit(limit)
		.toArray();
	},

	findOne: (board, page) => {
		return db.findOne({
			'board': board,
			'page': page
		});
	},

	boardCount: (board) => {
		return db.countDocuments({
			'board': board,
		});
	},

	insertOne: (custompage) => {
		return db.insertOne(custompage);
	},

	updateOne: () => {},

	deleteMany: (pages, board) => {
		return db.deleteMany({
			'page': {
				'$in': pages
			},
			'board': board
		});
	},

	deleteBoard: (board) => {
		return db.deleteMany({
			'board': board
		});
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

}
