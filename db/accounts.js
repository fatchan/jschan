'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('accounts')
	, bcrypt = require('bcrypt')
	, cache = require(__dirname+'/../redis.js');

module.exports = {

	db,

	countUsers: (usernames) => {
		return db.countDocuments({
			'_id': {
				'$in': usernames
			}
		});
	},

	count: (filter) => {
		if (filter) {
			return db.countDocuments(filter);
		} else {
			return db.estimatedDocumentCount();
		}
	},

	findOne: (username) => {
		return db.findOne({ '_id': username });
	},

	insertOne: async (original, username, password, authLevel) => {
		// hash the password
		const passwordHash = await bcrypt.hash(password, 12);
		//add to db
		const res = await db.insertOne({
			'_id': username,
			original,
			authLevel,
			passwordHash,
			'ownedBoards': [],
			'modBoards': []
		});
		cache.del(`users:${username}`);
		return res;
	},

	changePassword: async (username, newPassword) => {
		const passwordHash = await bcrypt.hash(newPassword, 12);
		const res = await db.updateOne({
			'_id': username
		}, {
			'$set': {
				'passwordHash': passwordHash
			}
		});
		cache.del(`users:${username}`);
		return res;
	},

	find: (filter, skip=0, limit=0) => {
		return db.find(filter, {
			'projection': {
				'passwordHash': 0
			}
		}).sort({
			'authLevel': 1
		}).skip(skip).limit(limit).toArray();
	},

	deleteMany: async (usernames) => {
		const res = await db.deleteMany({
			'_id': {
				'$in': usernames
			}
		});
		cache.del(usernames.map(n => `users:${n}`));
		return res;
	},

	addOwnedBoard: async (username, board) => {
		const res = await db.updateOne({
			'_id': username
		}, {
			'$addToSet': {
				'ownedBoards': board
			}
		});
		cache.del(`users:${username}`);
		return res;
	},

    removeOwnedBoard: async (username, board) => {
		const res = await db.updateOne({
			'_id': username
		}, {
			'$pull': {
				'ownedBoards': board
			}
		});
		cache.del(`users:${username}`);
		return res;
    },

	addModBoard: async (usernames, board) => {
		const res = await db.updateMany({
			'_id': {
				'$in': usernames
			}
		}, {
			'$addToSet': {
				'modBoards': board
			}
		});
		cache.del(`users:${username}`);
		return res;
	},

	removeModBoard: async (usernames, board) => {
		const res = await db.updateMany({
			'_id': {
				'$in': usernames
			}
		}, {
			'$pull': {
				'modBoards': board
			}
		});
		cache.del(`users:${username}`);
		return res;
	},

	getOwnedOrModBoards: (usernames) => {
		return db.find({
			'_id': {
				'$in': usernames
			},
			'$or': [
				{
					'ownedBoards.0': {
						'$exists': true
					},
				},
				{
					'modBoards.0': {
						'$exists': true
					}
				}
			]
		}, {
			'projection': {
				'ownedBoards': 1,
				'modBoards': 1,
			}
		}).toArray();
	},

	setLevel: async (usernames, level) => {
		//increase users auth level
		const res = await db.updateMany({
			'_id': {
				'$in': usernames
			}
		}, {
			'$set': {
				'authLevel': level
			}
		});
		cache.del(`users:${username}`);
		return res;
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

}
