'use strict';

module.exports = async(db, redis) => {
	console.log('Updating db for language settings, fixes broken 1.0.0 migration');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'boardDefaults.language': 'en-GB',
		},
	});

	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('Clearing boards cache');
	await redis.deletePattern('board:*');
};
