'use strict';

module.exports = async(db, redis) => {
	console.log('add sageOnlyEmail option to boards');
	await db.collection('boards').updateMany({}, {
		'$set': {
			'settings.sageOnlyEmail': false,
		}
	});
	console.log('Cleared boards cache');
	await redis.deletePattern('board:*');
};
