'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('accounts')
	, bcrypt = require('bcrypt');

module.exports = {

	db,

	countUsers: (usernames) => {
		return db.countDocuments({
			'_id': {
				'$in': usernames
			}
		});
	},

	count: () => {
		return db.estimatedDocumentCount();
	},

	findOne: (username) => {
		return db.findOne({ '_id': username });
	},

	insertOne: async (username, password, authLevel) => {
		// hash the password
		const passwordHash = await bcrypt.hash(password, 12);
		//add to db
		return db.insertOne({
			'_id': username,
			'passwordHash': passwordHash,
			'authLevel': authLevel,
		});
	},

	changePassword: async (username, newPassword) => {
		const passwordHash = await bcrypt.hash(newPassword, 12);
		return db.updateOne({
            '_id': username
        }, {
            '$set': {
                'passwordHash': passwordHash
            }
        });
	},

	find: (skip=0, limit=0) => {
		return db.find({}, {
			'projection': {
				'passwordHash': 0
			}
		}).sort({
			'authLevel': 1
		}).skip(skip).limit(limit).toArray();
	},

	deleteMany: (usernames) => {
		return db.deleteMany({
			'_id': {
				'$in': usernames
			}
		});
	},

	setLevel: (usernames, level) => {
		//increase users auth level
		return db.updateMany({
			'_id': {
				'$in': usernames
			}
		}, {
			'$set': {
				'authLevel': level
			}
		});
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

}
