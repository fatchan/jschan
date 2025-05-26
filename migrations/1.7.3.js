'use strict';

module.exports = async(db, redis) => {
	console.log('Adding hoverExpandsMedia to frontendScriptDefaults globalsetting');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'frontendScriptDefault.tegakiWidth': false,
		},
	});
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
};

