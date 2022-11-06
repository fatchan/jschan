'use strict';

module.exports = async(db, redis) => {
	console.log('setting 2fa/totp property on accounts');
	await db.collection('accounts').updateMany({}, {
		'$set': {
			'twofactor': null,
		}
	});
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
};
