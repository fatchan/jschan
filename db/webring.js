'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('webring');

module.exports = {

	db,

	boardSort: (skip=0, limit=50, sort={ ips:-1, pph:-1, sequence_value:-1 }, filter={}) => {
		const addedFilter = {};
		if (filter.search) {
			addedFilter['$or'] = [
				{ uri: filter.search },
				{ tags: filter.search }
			]
		}
		return db.find(addedFilter)
		.sort(sort)
		.skip(skip)
		.limit(limit)
		.toArray();
	},

	count: () => {
		//no need to countDocuments beacuse we dont filter anything. just use metadata
		return db.estimatedDocumentCount();
	},

	deleteAll: (board) => {
		return db.deleteMany({});
	},

}
