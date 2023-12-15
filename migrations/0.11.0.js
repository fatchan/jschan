'use strict';

module.exports = async(db, redis) => {

	console.log('changing post/report/ban ip type storage format');

	await db.collection('posts').updateMany({
		/* Make sure they all existing ones at least have a type 
		in case the site uses "dont store raw ips" */
	}, {
		'$set': {
			'ip.type': 0,
		}
	});	
	await db.collection('posts').updateMany({
		'ip.raw': /^([0-9]+(\.|$)){4}/
	}, [{
		'$set': {
			'ip.type': 0,
			'ip.cloak': {
				$concat: ['$ip.cloak', '4']
			}
		}
	}]);
	await db.collection('posts').updateMany({
		'ip.raw': /:/
	}, [{
		'$set': {
			'ip.type': 1,
			'ip.cloak': {
				$concat: ['$ip.cloak', '6']
			}
		}
	}]);
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
	await db.collection('posts').updateMany({}, {
		'$set': {
			reports: [],
			globalreports: [],
		}
	});

	await db.collection('bans').updateMany({
		/* Make sure they all existing ones at least have a type 
		in case the site uses "dont store raw ips" */
	}, {
		'$set': {
			'ip.type': 0,
		}
	});
	await db.collection('bans').updateMany({
		'ip.raw': /^([0-9]+(\.|$)){4}/
	}, [{
		'$set': {
			'ip.type': 0,
			'ip.cloak': {
				$concat: ['$ip.cloak', '4']
			}
		}
	}]);
	await db.collection('bans').updateMany({
		'ip.raw': /:/
	}, [{
		'$set': {
			'ip.type': 1,
			'ip.cloak': {
				$concat: ['$ip.cloak', '6']
			}
		}
	}]);
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

	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
};
