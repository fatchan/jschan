'use strict';

const hashIp = require(__dirname+'/../lib/misc/haship.js');

module.exports = async(db, redis) => {
	console.log('change bans index');
	await db.collection('bans').dropIndex('ip_1_board_1');
	await db.collection('bans').createIndex({ 'ip.single': 1 , 'board': 1 });
	console.log('adjusting ip on posts and clearing reports');
	const promises = [];
	await db.collection('posts').find().forEach(doc => {
		promises.push(db.collection('posts').updateOne({
			'_id':doc._id
		}, {
			'$set':{
				'ip.raw': doc.ip.single,
				'ip.single': hashIp(doc.ip.single),
				'ip.qrange': hashIp(doc.ip.qrange),
				'ip.hrange': hashIp(doc.ip.hrange),
				'reports': [], //easier than fixing reports
				'globalreports': [], //easier than fixing reports
			}
		}));
	});
	console.log('adjusting ip in modlogs');
	await db.collection('modlog').find().forEach(doc => {
		promises.push(db.collection('modlog').updateOne({
			'_id':doc._id
		}, {
			'$set':{
				'ip': {
					'raw': doc.ip,
					'single': hashIp(doc.ip)
				}
			}
		}));
	});
	console.log('adjust ip in bans, set null type and remove saved posts');
	await db.collection('bans').find().forEach(doc => {
		promises.push(db.collection('bans').updateOne({
			'_id':doc._id
		}, {
			'$set':{
				'ip': {
					'raw': doc.ip,
					'single': hashIp(doc.ip)
				},
				'type': null,
				'posts': null //easier than fixing all saved posts
			}
		}));
	});
	await Promise.all(promises);
	console.log('Cleared boards cache');
	await redis.deletePattern('board:*');
};
