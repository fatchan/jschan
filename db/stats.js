
'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.db.collection('poststats');

module.exports = {

	db,

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
		});
	},

	updateBoards: () => {
		return db.aggregate([
			{
				'$group': {
					'_id': '$board',
					'ppd': {
						'$sum': '$pph'
					},
					'pph': {
						'$push': { hour: '$hour', pph: '$pph' },
					},
					'ips': {
						'$addToSet': '$ips'
					}
				}
			}, {
				'$project': {
					'board': '$_id',
					'ips': 1,
					'ppd': 1,
					'pph': {
						$first: {
							$filter: {
								input: '$pph',
								as: 'hr',
								cond: {
									$eq: [ '$$hr.hour', (new Date().getHours()||24)-1 ]
								},
							}
						}
					}
				}
			}, {
				'$unwind': {
					'path': '$ips',
					'preserveNullAndEmptyArrays': true
				}
			}, {
				'$unwind': {
					'path': '$ips',
					'preserveNullAndEmptyArrays': true
				}
			}, {
				'$group': {
					'_id': '$_id',
					'ppd': {
						'$first': '$ppd'
					},
					'pph': {
						'$first': '$pph'
					},
					'ips': {
						'$addToSet': '$ips'
					}
				}
			}, {
				'$project': {
					'ips': {
						'$size': '$ips'
					},
					'ppd': 1,
					'pph': {
						'$ifNull': ['$pph.pph', 0]
					}
				}
			}, {
				'$merge': {
					'into': 'boards'
				}
			}
		]).toArray();
	},

	//reset stats, used at start of each hour
	resetStats: () => {
		return Promise.all([
			db.updateMany({
				'hour': new Date().getHours()
			}, {
				'$set': {
					'ips': [],
					'pph': 0,
					'tph': 0,
				}
			}),
		]);
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
