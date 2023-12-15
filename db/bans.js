
'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.db.collection('bans');

module.exports = {

	db,

	find: (ip, board) => {
		let ipQuery;
		if (typeof ip === 'object') {
			ipQuery = {
				'$in': [
					ip.cloak, //full ip
					ip.cloak.split('.').slice(0,2).join('.'), //qrange
					ip.cloak.split('.').slice(0,1).join('.'), //hrange
				],
			};
		} else {
			ipQuery = ip;
		}
		return db.find({
			'ip.cloak': ipQuery,
			'board': {
				'$in': [board, null]
			}
		}).toArray();
	},

	upgrade: async (board, ids, upgradeType) => {
		const substrProjection = upgradeType === 1
			? ['$ip.cloak', 0, 16]
			: ['$ip.cloak', 0, 8];
		const aggregateCursor = await db.aggregate([
			{
				'$match': {
					'_id': {
						'$in': ids,
					},
					'board': board,
					//bypass or pruned IP bans aren't upgraded, duh!
					'ip.type': {
						'$lt': 2,
					},
					//dont allow half -> quarter
					'range': {
						'$lt': upgradeType,
					}
				}
			}, {
				'$project': {
					'_id': 1,
					'board': 1,
					'range': {
						//mongoloidDB
						'$literal': upgradeType,
					},
					'ip.cloak': {
						'$substr': substrProjection,
					},
					'ip.raw': '$ip.raw',
					'ip.type': '$ip.type',
				}
			}, {
				'$merge': {
					'into': 'bans',
				}
			}
		]);
		//changing the order of these will result in a differene explain() output! nice.
		const aggregateExplained = await aggregateCursor.explain();
		await aggregateCursor.toArray();
		return aggregateExplained;
	},

	markSeen: (ids) => {
		return db.updateMany({
			'_id': {
				'$in': ids
			}
		}, {
			'$set': {
				'seen': true,
			}
		});
	},

	appeal: (ip, ids, appeal) => {
		return db.updateMany({
			'_id': {
				'$in': ids
			},
			'ip.cloak': ip,
			'allowAppeal': true,
			'appeal': null
		}, {
			'$set': {
				'appeal': appeal,
			}
		});
	},

	getGlobalBans: () => {
		return db.find({
			'board': null
		}).sort({
			'allowAppeal': -1,
			'appeal': -1,
			'date': -1,
		}).toArray();
	},

	getBoardBans: (board) => {
		return db.find({
			'board': board,
		}).sort({
			'allowAppeal': -1,
			'appeal': -1,
			'date': -1,
		}).toArray();
	},

	denyAppeal: (board, ids) => {
		return db.updateMany({
			'board': board,
			'_id': {
				'$in': ids
			},
/*
			//allow denying appeal even if missing, to allow moving ban to bottom of list
			'allowAppeal': true,
			'appeal': {
				'$ne': null
			},
*/
		}, {
			'$set': {
				'allowAppeal': false,
			}
		});
	},

	editDuration: (board, ids, newExpireAt) => {
		return db.updateMany({
			'board': board,
			'_id': {
				'$in': ids
			},
		}, {
			'$set': {
				'expireAt': newExpireAt,
			}
		});
	},

	editNote: (board, ids, newNote) => {
		return db.updateMany({
			'board': board,
			'_id': {
				'$in': ids
			},
		}, {
			'$set': {
				'note': newNote,
			}
		});
	},

	removeMany: (board, ids) => {
		return db.deleteMany({
			'board': board,
			'_id': {
				'$in': ids
			}
		});
	},

	deleteBoard: (board) => {
		return db.deleteMany({
			'board': board
		});
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

};
