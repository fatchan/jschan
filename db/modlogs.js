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
						'$year': '$_id'
					},
					'month': {
						'$month': '$_id'
					},
					'day': {
						'$dayOfMonth': '$_id'
					}
				}
			},
			{
				'$group': {
					'_id': null,
					'dates': {
						'$addToSet': {
							'year': '$year',
							'month': '$month',
							'day': '$day',
						}
					}
				}
			},
			{
				'$unwind': '$dates'
			},
            {
                '$sort': {
                    'dates.year': -1,
                    'dates.month': -1,
                    'dates.day': -1
                }
            },
			{
				'$group': {
					'_id': null,
					'dates': {
						'$push': '$dates'
					}
				}
			}
		]).toArray().then(res => res[0].dates);
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
