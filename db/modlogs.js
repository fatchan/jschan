'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('modlog');

module.exports = {

	getFirst: (board) => {
		return db.find({
			'board': board._id
		}).sort({_id:1}).limit(1).toArray();
	},

	getLast: (board) => {
		return db.find({
			'board': board._id
		}).sort({_id:-1}).limit(1).toArray();
	},

	findBetweenDate: (board, start, end) => {
		const startDate = Mongo.ObjectId.createFromTime(Math.floor(start.getTime()/1000));
		const endDate = Mongo.ObjectId.createFromTime(Math.floor(end.getTime()/1000));
		return db.find({
			'_id': {
				'$gte': startDate,
				'$lte': endDate
			},
			'board': board._id
		}).sort({
			'_id': -1
		}).toArray();
	},

	insertMany: (events) => {
		return db.insertMany(events);
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
