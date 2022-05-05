
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

	//browsing board
	findOne: (board, page) => {
		return db.findOne({
			'board': board,
			'page': page
		});
	},

	//editing
	findOneId: (id, board) => {
		return db.findOne({
			'_id': id,
			'board': board,
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

	findOneAndUpdate: (id, board, page, title, raw, markdown, edited) => {
		return db.findOneAndUpdate({
			'_id': id,
			'board': board,
		}, {
			'$set': {
				'page': page,
				'title': title,
				'message.raw': raw,
				'message.markdown': markdown,
				'edited': edited,
			}
		}, {
			returnDocument: 'before',
		});
	},

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

};
