'use strict';

module.exports = async(db, redis) => {
	console.log('Adding blockedCountries field to boards');
	await db.collection('boards').updateMany({}, {
		'$set': {
			'settings.blockedCountries': [],
		}
	});
	console.log('Cleared boards cache');
	await redis.deletePattern('board:*');
};
