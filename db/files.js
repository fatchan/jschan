'use strict';

const Mongo = require(__dirname+'/db.js')
	, Boards = require(__dirname+'/boards.js')
	, formatSize = require(__dirname+'/../helpers/files/formatsize.js')
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
			'$addToSet': {//save list of thumb exts incase config is changed to track old exts
				'exts': file.thumbextension,
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

	activeContent: () => {
		return db.aggregate([
			{
				'$group': {
					'_id': null,
					'count': {
						'$sum': 1
					},
					'size': {
						'$sum': '$size'
					}
				}
			}
		]).toArray().then(res => {
			const stats = res[0];
			if (stats) {
				return {
					count: stats.count,
					totalSize: stats.size,
					totalSizeString: formatSize(stats.size)
				}
			} else {
				return {
					count: 0,
					totalSize: 0,
					totalSizeString: '0B'
				}
			}
		});
	},

	deleteAll: () => {
		return db.deleteMany({});
	}

}
