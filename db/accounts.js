
'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('accounts')
	, bcrypt = require('bcrypt');

module.exports = {

	count: (usernames) => {
		return db.countDocuments({
			'_id': {
				'$in': usernames
			}
		});
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
		//skip and limit incase pagination is ever needed, can be added and maybe move to separate page on globalmanage
		return db.find({}, {
			'projection': {
				'passwordHash': 0
			}
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
