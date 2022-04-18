'use strict';

module.exports = async(db, redis) => {
	console.log('Add global wordfilter autoban non-appealable option');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'filterBanAppealable': true,
		},
	});
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
};
