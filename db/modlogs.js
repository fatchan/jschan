'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('modlog');

module.exports = {

	getDates: (board) => {
		return db.aggregate([
            {
                '$match': {
                    'board': board._id
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
