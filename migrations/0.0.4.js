'use strict';

module.exports = async(db, redis) => {
	console.log('Renaming some settings fields on boards');
	await db.collection('boards').updateMany({}, {
		'$rename': {
			'settings.locked': 'settings.lockMode',
			'settings.unlisted': 'settings.unlistedLocal',
			'settings.webring': 'settings.unlistedWebring'
		}
	});
	console.log('upadting renamed fields to proper values');
	await db.collection('boards').updateMany({
		'settings.lockMode': true,
	}, {
		'$set': {
			'settings.lockMode': 2,
		}
	});
	await db.collection('boards').updateMany({
		'settings.lockMode': false,
	}, {
		'$set': {
			'settings.lockMode': 0,
		}
	});
	await db.collection('boards').updateMany({
		'settings.triggerAction': 3,
	}, {
		'$set': {
			'settings.triggerAction': 4,
		}
	});
	console.log('clearing boards cache');
	await redis.deletePattern('board:*');
};
