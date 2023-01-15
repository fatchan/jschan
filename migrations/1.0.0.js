'use strict';

module.exports = async(db, redis) => {
	console.log('Updating db for language settings');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'language': 'en',
		},
	});
	await db.collection('boards').updateMany({}, {
		'$set': {
			'settings.language': 'en',
		},
	});	
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('Clearing boards cache');
	await redis.deletePattern('board:*');
};
