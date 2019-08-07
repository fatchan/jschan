'use strict';

const Mongo = require(__dirname+'/db.js')
	, Boards = require(__dirname+'/boards.js')
	, db = Mongo.client.db('jschan').collection('files')

module.exports = {

	db,

	increment: (file) => {
		return db.updateOne({
			'_id': file.filename
		}, {
			'$inc': {
				'count': 1
			},
			'$setOnInsert': {
				'size': file.size
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
			'upsert': true //probably not necessary
		});
	},

	deleteAll: () => {
		return db.deleteMany({});
	}

}
