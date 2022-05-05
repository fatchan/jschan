'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.db.collection('webring');

module.exports = {

	db,

	boardSort: (skip=0, limit=50, sort={ ips:-1, pph:-1, sequence_value:-1 }, filter={}) => {
		const addedFilter = {};
		if (filter.search) {
			addedFilter['$or'] = [
				{ uri: filter.search },
				{ tags: filter.search }
			];
		}
		const addedSort = {};
		if (sort.ips) {
			addedSort['uniqueUsers'] = sort.ips;
		}
		if (sort.pph) {
			addedSort['postsPerHour'] = sort.pph;
		}
		if (sort.sequence_value) {
			addedSort['totalPosts'] = sort.sequence_value;
		}
		if (sort.lastPostTimestamp) {
			addedSort['lastPostTimestamp'] = sort.lastPostTimestamp;
		}
		return db.find(addedFilter)
			.sort(addedSort)
			.skip(skip)
			.limit(limit)
			.toArray();
	},

	count: (filter) => {
		const addedFilter = {};
		if (filter.search) {
			addedFilter['$or'] = [
				{ uri: filter.search },
				{ tags: filter.search }
			];
		}
		return db.countDocuments(addedFilter);
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

};
