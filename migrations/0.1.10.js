'use strict';

module.exports = async(db, redis) => {
	console.log('Adding threadwatcher to frontend script settings');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'frontendScriptDefault.threadWatcher': true,
		},
	});
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
};
