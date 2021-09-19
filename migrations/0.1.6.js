'use strict';

module.exports = async(db, redis) => {
	console.log('Adding custom overboard toggle');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'allowCustomOverboard': false,
			'boardDefaults.archiveLinks': false,
			'boardDefaults.reverseImageSearchLinks': false,
		},
	});
	console.log('Cleared globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('adding archive and imgops link options');
	await db.collection('boards').updateMany({}, {
		'$set': {
			'settings.archiveLinks': false,
			'settings.reverseImageSearchLinks': false,
		}
	});
	console.log('Cleared boards cache');
	await redis.deletePattern('board:*');

};
