'use strict';

module.exports = async(db, redis) => {
	console.log('Updating edited posts username property for "hidden users" to support localisation');
	await db.collection('posts').updateMany({
		'edited.username': 'Hidden User',
	}, {
		'$set': {
			'edited.username': null,
		},
	});	
	console.log('Updating db for language settings');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'language': 'en-GB',
		},
	});
	await db.collection('boards').updateMany({}, {
		'$set': {
			'settings.language': 'en-GB',
		},
	});	
	await db.collection('modlog').updateMany({
		'actions': 'Edit',
	}, {
		'$set': {
			'actions': ['Edit'],
		},
	});
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('Clearing boards cache');
	await redis.deletePattern('board:*');
};
