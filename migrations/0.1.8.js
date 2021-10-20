'use strict';

module.exports = async(db, redis) => {
	console.log('Adding OP delete protection options to board settings');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'boardDefaults.deleteProtectionAge': 0,
			'boardDefaults.deleteProtectionCount': 0,
		},
	});
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
	await db.collection('boards').updateMany({}, {
		'$set': {
			'settings.deleteProtectionAge': 0,
			'settings.deleteProtectionCount': 0,
		}
	});
	console.log('Clearing boards cache');
	await redis.deletePattern('board:*');

};
