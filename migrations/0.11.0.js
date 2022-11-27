'use strict';

module.exports = async(db, redis) => {

	console.log('changing post/report/ban ip type storage format');
	await db.collection('posts').updateMany({
		'ip.cloak': /PRUNED$/
	}, {
		'$set': {
			'ip.type': 3,
		}
	});
	await db.collection('posts').updateMany({
		'ip.cloak': /BP$/
	}, {
		'$set': {
			'ip.type': 2,
		}
	});
	await db.collection('posts').updateMany({
		'ip.cloak': /IP[46]*$/
	}, {
		'$set': {
			'ip.type': 0, //wont try and figure out migrating ipv4 vs 6
		}
	});
	await db.collection('posts').updateMany({}, {
		'$set': {
			reports: [],
			globalreports: [],
		}
	});

	await db.collection('bans').updateMany({
		'ip.cloak': /PRUNED$/
	}, {
		'$set': {
			'ip.type': 3,
		}
	});
	await db.collection('bans').updateMany({
		'ip.cloak': /BP$/
	}, {
		'$set': {
			'ip.type': 2,
		}
	});
	await db.collection('bans').updateMany({
		'ip.cloak': /IP[46]*$/
	}, {
		'$set': {
			'ip.type': 0,
		}
	});

	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
};
