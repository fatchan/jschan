'use strict';

module.exports = async(db, redis) => {
	console.log('Adding disableOnionFilePosting setting');
	await db.collection('boards').updateMany({}, {
		'$set': {
			'settings.disableOnionFilePosting': false,
		}
	});
	console.log('Cleared boards cache');
	await redis.deletePattern('board:*');
};
