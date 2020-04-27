'use strict';

const { globalLimits } = require(__dirname+'/../configs/main.js');

module.exports = async(db, redis) => {
	console.log('Adding bumplimit field to boards on posts');
	await db.collection('boards').updateMany({}, {
		'$set': {
			'settings.bumpLimit': globalLimits.bumpLimit.max,
		}
	});
	console.log('Cleared boards cache');
	await redis.deletePattern('board:*');
	console.log('Cleared globalsettings cache');
	await redis.deletePattern('globalsettings');
};
