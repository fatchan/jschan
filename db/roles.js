'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.db.collection('roles')
	, cache = require(__dirname+'/../lib/redis/redis.js');

module.exports = {

	db,

	findOne: async (id) => {
		//is there any point even caching
		let role = await cache.get(`role:${id}`);
		if (role) {
			return role;
		} else {
			role = await db.findOne({ '_id': id });
			if (role) {
				role.permissions = role.permissions.toString('base64');
				cache.set(`role:${id}`, role);
			}
		}
		return role;
	},

	find: () => {
		return db.find({}).toArray();
	},

	updateOne: async (id, permissions) => {
		const res = await db.updateOne({
			'_id': id
		}, {
			'$set': {
				'permissions': Mongo.Binary(permissions.array),
			},
		});
		cache.del(`role:${id}`);
		return res;
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

};
