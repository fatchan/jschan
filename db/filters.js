
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

	count: (board=null) => {
		return db.countDocuments({'board': board});
	},

	findOne: (board=null, id) => {
		return db.findOne({
			'_id': id,
			'board': board,
		});
	},

	updateOne: async (board=null, id, filters, strictFiltering, filterMode, filterMessage, filterBanDuration, filterBanAppealable) => {
		const updatedFilter = await db.updateOne({
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
		await cache.del(`filters:${board}`);
		return updatedFilter;
	},

	insertOne: async (filter) => {
		const insertedFilter = await db.insertOne(filter);
		await cache.del(`filters:${filter.board}`);
		return insertedFilter;
	},

	deleteMany: async (board=null, ids) => {
		const deletedFilter = await db.deleteMany({
			'_id': {
				'$in': ids
			},
			'board': board
		});
		await cache.del(`filters:${board}`);
		return deletedFilter;
	},

	deleteBoard: async (board=null) => {
		const deletedFilters = await db.deleteMany({ 'board': board });
		await cache.del(`filters:${board}`);
		return deletedFilters;
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

};
