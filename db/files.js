'use strict';

const Mongo = require(__dirname+'/db.js')
	, Boards = require(__dirname+'/boards.js')
	, db = Mongo.client.db('jschan').collection('files')

module.exports = {

	db,

	increment: (fileNames) => {
		return db.updateMany({
			'_id': {
				'$in': fileNames
			}
		}, {
			'$inc': {
				'count': 1
			}
		}, {
			'upsert': true
		});
	},

	decrement: (fileNames) => {
		return db.updateMany({
			'_id': {
				'$in': fileNames
			}
		}, {
			'$inc': {
				'count': -1
			}
		}, {
			'upsert': true //maybe not necessary
		});
	},

	deleteAll: () => {
		return db.deleteMany({});
	}

}
