'use strict';

module.exports = async(db, redis) => {
	console.log('Renamed "yotsuba b" to "yotsuba-b" in any board settings');
	await db.collection('boards').updateMany({
		'settings.theme': 'yotsuba b',
	}, {
		'$set': {
			'settings.theme': 'yotsuba-b',
		}
	});
	console.log('Cleared boards cache');
	await redis.deletePattern('board:*');
};
