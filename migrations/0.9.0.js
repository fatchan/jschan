'use strict';

module.exports = async(db, redis) => {
	console.log('add globalsettings board default option, and tegaki replay mime to allowed mime types');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'boardDefaults.hideBanners': false,
			'overboardReverseLinks': true,
		},
		'$push': {
			'otherMimeTypes': 'tegaki/replay',
		},
	});
	console.log('add board option to hide banners and [banners] link');
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
