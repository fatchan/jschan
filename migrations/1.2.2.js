'use strict';

module.exports = async(db, redis) => {

	console.log('Updating globalsettings to add uriDecodeFileNames');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'uriDecodeFileNames': false,
		},
	});

	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');

};
