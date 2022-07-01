'use strict';

const timeUtils = require(__dirname+'/../lib/converter/timeutils.js');

module.exports = async(db, redis) => {
	console.log('add inactive account and board auto handling');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			inactiveAccountTime: timeUtils.MONTH * 3,
			inactiveAccountAction: 0, //no actions by default
			abandonedBoardAction: 0,
		},
	});
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
};
