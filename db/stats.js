
'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('poststats');

module.exports = {

	updateOne: (board, ip) => {
		return db.updateOne({
			'board': board,
			'hour': new Date().getHours()
		}, {
			'$inc': {
				'pph': 1
			},
			'$addToSet': {
				'ips': ip
			}
		}, {
			'upsert': true
		});
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

	resetIps: () => {
		return db.updateMany({
			'hour': new Date().getHours()
		}, {
			'$set': {
				'ips': []
			}
		});
	},

	resetPph: () => {
		return db.updateMany({}, {
			'$set': {
				'pph': 0
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
