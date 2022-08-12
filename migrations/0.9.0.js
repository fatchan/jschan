'use strict';

module.exports = async(db, redis) => {
	console.log('add board option to hide banners and [banners] link, and globalsettings board default option');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'boardDefaults.hideBanners': false,
		},
	});
	await db.collection('boards').updateMany({
		'webring': false,
	}, {
		'$set':{
			'settings.hideBanners': false,
		},
	});
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('Clearing boards cache');
	await redis.deletePattern('board:*');
};
