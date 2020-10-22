'use strict';

module.exports = async(db, redis) => {
	console.log('Adding message r9k option to boards db');
	await db.collection('boards').updateMany({}, {
		'$set': {
			'settings.messageR9KMode': 0,
		}
	});
	console.log('Cleared boards cache');
	await redis.deletePattern('board:*');
};
