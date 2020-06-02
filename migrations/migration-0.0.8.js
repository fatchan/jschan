'use strict';

module.exports = async(db, redis) => {
	console.log('add resetTrigger option to boards');
	await db.collection('boards').updateMany({}, {
		'$set': {
			'settings.resetTrigger': false,
		}
	});
	console.log('Cleared boards cache');
	await redis.deletePattern('board:*');
};
