'use strict';

module.exports = async(db, redis) => {
	console.log('Adding tegaki sizes to globalsettings, and toggle option to board settings');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'frontendScriptDefault.tegakiWidth': 500,
			'frontendScriptDefault.tegakiHeight': 500,
			'boardDefaults.enableTegaki': true,
		},
	});
	await db.collection('boards').updateMany({
		'webring': false,
	}, {
		'$set':{
			'settings.enableTegaki': true,
		},
	});
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('Clearing user and board cache');
	await redis.deletePattern('board:*');
};
