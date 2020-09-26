'use strict';

module.exports = async(db, redis) => {
	console.log('Adding file r9k setting to boards db');
	await db.collection('boards').updateMany({}, {
		'$set': {
			'settings.fileR9KMode': 0,
		}
	});
	console.log('Cleared boards cache');
	await redis.deletePattern('board:*');
};
