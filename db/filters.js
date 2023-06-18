
'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.db.collection('filters');

module.exports = {

	db,

	// null board retrieves global filters only
	findForBoard: (board=null, limit=0) => {
		return db.find({'board': board}).sort({
			'_id': -1
		})
			.limit(limit)
			.toArray();
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
		return db.insertOne(filter);
	},

	deleteMany: (board, ids) => {
		return db.deleteMany({
			'_id': {
				'$in': ids
			},
			'board': board
		});
	},

	deleteBoard: (board) => {
		return db.deleteMany({'board': board});
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

};
