'use strict';

module.exports = async(db, redis) => {
	console.log('adding image/video resolution maximum setting');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'globalLimits.postFilesSize.imageResolution': 100000000,
			'globalLimits.postFilesSize.videoResolution': 77414400,
		},
	});
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
};
