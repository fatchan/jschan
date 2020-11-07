'use strict';

module.exports = async(db, redis) => {
	console.log('Allow tph/pph separate triggers and resets');
	await db.collection('boards').updateMany({}, {
		'$rename': {
			'settings.triggerAction' : 'settings.pphTriggerAction',
		}
	});
	await db.collection('boards').updateMany({}, {
		'$unset': {
			'settings.resetTrigger' : '',
			'preTriggerMode': '',
		}
	});
	await db.collection('boards').updateMany({}, {
		'$set': {
			'settings.tphTriggerAction' : 0,
			'settings.captchaReset' : 0,
			'settings.lockReset' : 0,
		}
	});
	console.log('Cleared boards cache');
	await redis.deletePattern('board:*');
};
