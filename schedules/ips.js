'use strict';

/*
prune IPs from old posts (actually, rehash them with a temporary random salt to maintain
post history and prevent *-by-ip action unintentionally deleting many posts)
NOTE: ips may still remain in the following collections:
- bans, because bans need the IP to function
- modlog actioner ips, modlogs are already auto-pruned
- ratelimits, these only last 1 minute
- stats, these last max of 24 hours
*/
const Mongo = require(__dirname+'/../db/db.js')
	, { Posts } = require(__dirname+'/../db/')
	, { createHash, randomBytes } = require('crypto')
	, { pruneIps } = require(__dirname+'/../configs/main.js');

module.exports = async (days) => {
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
}
