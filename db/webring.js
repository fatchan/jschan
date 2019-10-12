'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('webring');

module.exports = {

	db,

	boardSort: (skip=0, limit=50, sort={ ips:-1, pph:-1, sequence_value:-1 }, filter={}) => {
		const addedFilter = {};
		if (filter.name) {
			addedfilter.uri = filter.name;
		}
		return db.find(addedFilter)
		.sort({
			'uniqueUsers': sort.ips,
			'postsPerHour': sort.pph,
			'totalPosts': sort.sequence_value,
		})
		.skip(skip)
		.limit(limit)
		.toArray();
	},

	count: () => {
		//no need to countDocuments beacuse we dont filter anything. just use metadata
		return db.estimateDocumentCount();
	},

	deleteAll: (board) => {
		return db.deleteMany({});
	},

}
