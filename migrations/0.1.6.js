'use strict';

module.exports = async(db, redis) => {
	console.log('Adding custom overboard toggle, links for archive and reverse image urls and add to board defaults');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'allowCustomOverboard': false,
			'archiveLinksURL': 'https://archive.today/?run=1&url=%s',
			'reverseImageLinksURL': 'https://tineye.com/search?url=%s',
			'boardDefaults.archiveLinks': false,
			'boardDefaults.reverseImageSearchLinks': false,
		},
	});
	console.log('Cleared globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('Adding archive and imgops link options to boards');
	await db.collection('boards').updateMany({}, {
		'$set': {
			'settings.archiveLinks': false,
			'settings.reverseImageSearchLinks': false,
		}
	});
	console.log('Cleared boards cache');
	await redis.deletePattern('board:*');

};
