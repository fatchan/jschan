'use strict';

module.exports = async(db, redis) => {
	console.log('Adding custom overboard toggle');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'allowCustomOverboard': false,
		},
	});
	console.log('Cleared globalsettings cache');
	await redis.deletePattern('globalsettings');
};
