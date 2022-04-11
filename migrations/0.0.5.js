'use strict';

const config = require(__dirname+'/../lib/misc/config.js');

module.exports = async(db, redis) => {
	console.log('Adding bumplimit field to boards on posts');
	await db.collection('boards').updateMany({}, {
		'$set': {
			'settings.bumpLimit': config.get.globalLimits.bumpLimit.max,
		}
	});
	console.log('Cleared boards cache');
	await redis.deletePattern('board:*');
	console.log('Cleared globalsettings cache');
	await redis.deletePattern('globalsettings');
};
