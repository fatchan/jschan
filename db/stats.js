
'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('poststats');

module.exports = {

	updateOne: (board, ip, thread) => {
		return db.updateOne({
			'board': board,
			'hour': new Date().getHours()
		}, {
			'$inc': {
				'pph': 1,
				'tph': thread ? 1 : 0
			},
			'$addToSet': {
				'ips': ip
			}
		}, {
			'upsert': true
		});
	},

	getHourPosts: (board) => {
		return db.findOne({
			'board': board,
			'hour': new Date().getHours()
		}, {
			'projection': {
				'_id': 0,
				'pph': 1,
				'tph': 1
			}
		})
	},

	updateBoards: () => {
		return db.aggregate([
			{
				'$group': {
					'_id': '$board',
					'ips': {
						'$sum': {
							'$size': '$ips'
						}
					},
					'pph': {
						'$sum': '$pph'
					}
				}
			}, {
				'$merge': {
					'into': 'boards'
				}
			}
		]).toArray();
	},

	//reset IP list for previous hour
	resetIps: () => {
		const hour = new Date();
		return db.updateMany({
			'hour': hour.setHours(hour.getHours()-1)
		}, {
			'$set': {
				'ips': []
			}
		});
	},

	//reset all hours.
//TODO: implement a $facet with 2 groups in updateBoards so I can keep pph across hours
	resetPph: () => {
		return db.updateMany({}, {
			'$set': {
				'pph': 0,
				'tph': 0
			}
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
