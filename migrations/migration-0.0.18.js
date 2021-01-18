'use strict';

module.exports = async(db, redis) => {
	console.log('Renaming disable onion file posting to disable anonymizer file posting');
	await db.collection('boards').updateMany({}, {
		'$rename': {
			'settings.disableOnionFilePosting' : 'settings.disableAnonymizerFilePosting',
		}
	});
	console.log('Cleared boards cache');
	await redis.deletePattern('board:*');
};
