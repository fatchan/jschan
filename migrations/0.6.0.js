'use strict';

module.exports = async(db, redis) => {
	console.log('Addjusting bans to categorise between normal/bypass/pruned, required for ban upgrading capabilities');
	await db.collection('bans').updateMany({
		'ip.cloak': /\.IP$/
	}, {
		'$set':{
			'category': 0,
		},
	});
	await db.collection('bans').updateMany({
		'ip.cloak': /\.BP$/
	}, {
		'$set':{
			'category': 1,
		},
	});
	await db.collection('bans').updateMany({
		'ip.cloak': /\.PRUNED$/
	}, {
		'$set':{
			'category': 2,
		},
	});
};
