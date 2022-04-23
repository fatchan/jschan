'use strict';

module.exports = async(db, redis) => {

	console.log('unfucking any broken board tags')
	await db.collection('boards').updateMany({
		'webring': false,
		'tags': null,
	}, {
		'$set': {
			'tags': [], //null -> empty array, for broken boards
		}
	});
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('Clearing board cache');
	await redis.deletePattern('board:*');

};
