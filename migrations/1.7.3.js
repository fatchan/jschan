'use strict';

module.exports = async(db, redis) => {
	console.log('Adding hoverExpandsMedia and follow cursor to frontendScriptDefaults globalsetting');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'frontendScriptDefault.hoverExpandsMedia': false,
			'frontendScriptDefault.hoverExpandFollowCursor': false,
			'boardDefaults.autoBumplockTime': 0,
		},
	});
	await db.collection('boards').updateMany({}, {
		'$set': {
			'settings.autoBumplockTime': 0,
		},
	});

	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('Clearing boards cache');
	await redis.deletePattern('board:*');
};

