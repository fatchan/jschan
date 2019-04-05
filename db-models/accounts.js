
'use strict';

const Mongo = require(__dirname+'/../helpers/db.js')
	, db = Mongo.client.db('jschan').collection('accounts')
	, bcrypt = require('bcrypt');

module.exports = {

	findOne: (username) => {
		return db.findOne({ '_id': username });
	},

	insertOne: async (username, password, authLevel) => {
		/* auth levels
		3: site admin/owner -- all permissions e.g. post/board/board config management
		2: global mod -- delete posts anywhere
		1: regular user -- permissions for boards they own or were given moderator on
		on user-created boards (planned feature), only owner can delete board or change board settings
		assigned moderators can delete posts.
		*/

		// hash the password
		const passwordHash = await bcrypt.hash(password, 12);

		//add to db
		return db.insertOne({
			'_id': username,
			'passwordHash': passwordHash,
			'authLevel': authLevel,
		});
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
