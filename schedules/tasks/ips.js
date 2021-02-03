'use strict';

const Mongo = require(__dirname+'/../../db/db.js')
	, { Posts } = require(__dirname+'/../../db/')
	, { createHash, randomBytes } = require('crypto')
	, { pruneIps } = require(__dirname+'/../../configs/main.js')
	, timeUtils = require(__dirname+'/../../helpers/timeutils.js');

module.exports = {

	func: async (days) => {
		const beforeDate = new Date();
		beforeDate.setDate(beforeDate.getDate() - days);
		const beforeDateMongoId = Mongo.ObjectId.createFromTime(Math.floor(beforeDate.getTime()/1000));
		const tempIpHashSecret = randomBytes(20).toString('base64');
		const bulkWrites = [];
		await Posts.db.find({
			_id: {
				$lte: beforeDateMongoId,
			},
			'ip.pruned': {
				$ne: true
			}
		}).forEach(post => {
			const randomIP = createHash('sha256').update(tempIpHashSecret + post.ip.single).digest('base64');
			bulkWrites.push({
				updateOne: {
					filter: {
						_id: post._id,
					},
					update: {
						$set: {
							'ip.pruned': true,
							'ip.raw': randomIP,
							'ip.single': randomIP,
							'ip.qrange': randomIP,
							'ip.hrange': randomIP,
						}
					}
				}
			});
		});
		console.log(`Randomising ip on ${bulkWrites.length} posts`);
		if (bulkWrites.length.length > 0) {
			await Posts.db.bulkWrite(bulkWrites);
		}
	},
	interval: timeUtils.DAY,
	immediate: true,
	condition: 'pruneIps',

}
