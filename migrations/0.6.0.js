'use strict';

module.exports = async(db, redis) => {
	console.log('rename ban type -> range');
	await db.collection('bans').updateMany({}, {
		'$rename': {
			'type': 'range',
		},
	});

	console.log('change ban range from strings to number');
	await db.collection('bans').updateMany({
		'range': 'single'
	}, {
		'$set': {
			'range': 0,
		},
	});
	await db.collection('bans').updateMany({
		'range': 'qrange'
	}, {
		'$set': {
			'range': 1,
		},
	});
	await db.collection('bans').updateMany({
		'range': 'hrange'
	}, {
		'$set': {
			'range': 2,
		},
	});

	console.log('set new ban.type based on ip/bypass/pruned');
	await db.collection('bans').updateMany({
		'ip.cloak': /\.IP$/
	}, {
		'$set':{
			'type': 0,
		},
	});
	await db.collection('bans').updateMany({
		'ip.cloak': /\.BP$/
	}, {
		'$set':{
			'type': 1,
		},
	});
	await db.collection('bans').updateMany({
		'ip.cloak': /\.PRUNED$/
	}, {
		'$set':{
			'type': 2,
		},
	});
};
