
'use strict';

const Mongo = require(__dirname+'/db.js')
	, cache = require(__dirname+'/../lib/redis/redis.js')
	, db = Mongo.db.collection('filters');

module.exports = {

	db,

	// null board retrieves global filters only
	findForBoard: async (board=null, limit=0) => {
		let filters = await cache.get(`filters:${board}`);
		if (filters) {
			return filters === 'no_exist' ? [] : filters;
		} else {
			filters = await db.find({
				'board': board
			}).sort({
				'_id': -1
			})
				.limit(limit)
				.toArray();
			if (filters) {
				cache.set(`filters:${board}`, filters, 3600);
			} else {
				cache.set(`filters:${board}`, 'no_exist', 600);
			}
		}
		return filters;
	},

	count: (board) => {
		return db.countDocuments({'board': board});
	},

	findOne: (board, id) => {
		return db.findOne({
			'_id': id,
			'board': board,
		});
	},

	updateOne: (board, id, filters, strictFiltering, filterMode, filterMessage, filterBanDuration, filterBanAppealable) => {
		cache.del(`filters:${board}`);
		return db.updateOne({
			'_id': id,
			'board': board,
		}, {
			'$set': {
				'filters': filters,
				'strictFiltering': strictFiltering,
				'filterMode': filterMode,
				'filterMessage': filterMessage,
				'filterBanDuration': filterBanDuration,
				'filterBanAppealable': filterBanAppealable,
			}
		});
	},

	insertOne: (filter) => {
		cache.del(`filters:${filter.board}`);
		return db.insertOne(filter);
	},

	deleteMany: (board, ids) => {
		cache.del(`filters:${board}`);
		return db.deleteMany({
			'_id': {
				'$in': ids
			},
			'board': board
		});
	},

	deleteBoard: (board) => {
		cache.del(`filters:${board}`);
		return db.deleteMany({ 'board': board });
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

};
