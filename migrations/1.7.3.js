'use strict';

module.exports = async(db, redis) => {
	console.log('Adding hoverExpandsMedia and follow cursor to frontendScriptDefaults globalsetting');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'frontendScriptDefault.hoverExpandsMedia': false,
			'frontendScriptDefault.hoverExpandFollowCursor': false,
		},
	});
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
};

