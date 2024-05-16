'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.db.collection('modlog');

module.exports = {

	db,

	getDates: (board, publicOnly=true) => {
		return db.aggregate([
			{
				'$match': {
					...(publicOnly ? { 'public': true } : {}),
					'board': board
				}
			},
			{
				'$project': {
					'year': {
						'$year': '$date'
					},
					'month': {
						'$month': '$date'
					},
					'day': {
						'$dayOfMonth': '$date'
					}
				}
			},
			{
				'$group': {
					'_id': {
						'year': '$year',
						'month': '$month',
						'day': '$day',
					},
					'count': {
						'$sum': 1
					}
				}
			},
			{
				'$project': {
					'_id': 0,
					'date': '$_id',
					'count': '$count'
				}
			},
			{
				'$sort': {
					'date.year': -1,
					'date.month': -1,
					'date.day': -1
				}
			},
		]).toArray();
	},

	find: (filter, offset, limit) => {
		return db.find(filter)
			.skip(offset)
			.limit(limit)
			.sort({
				'_id': -1
			})
			.toArray();
	},

	count: (filter) => {
		return db.countDocuments(filter);
	},

	findBetweenDate: (board, start, end, publicOnly=true) => {
		const startDate = Mongo.ObjectId.createFromTime(Math.floor(start.getTime()/1000));
		const endDate = Mongo.ObjectId.createFromTime(Math.floor(end.getTime()/1000));
		return db.find({
			'_id': {
				'$gte': startDate,
				'$lte': endDate
			},
			'board': board._id,
			...(publicOnly ? { 'public': true } : {}),
		}, {
			projection: {
				'ip': 0,
			}
		}).sort({
			'_id': -1
		}).toArray();
	},

	deleteOld: (board, date) => {
		const monthOld = Mongo.ObjectId.createFromTime(Math.floor(date.getTime()/1000));
		return db.deleteMany({
			'_id': {
				'$lt': monthOld,
			},
			'board': board,
		});
	},

	insertOne: (event) => {
		return db.insertOne(event);
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

};
