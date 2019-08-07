
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
        })
	},

	promoteUser: (username, newlevel) => {
		//increase users auth level
		return db.updateOne({
			'_id': username
		}, {
			'$set': {
				'authLevel': newlevel
			}
		})
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

}
