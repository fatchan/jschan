'use strict';

module.exports = async(db, redis) => {

	console.log('Updating globalsettings to add 2fa enforcement options');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'forceAccountTwofactor': false,
			'forceActionTwofactor': false, //TODO: potentially break this down to be more granular on what needs 2fa
		},
	});
	
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('Clearing boards cache');
	await redis.deletePattern('board:*');

};
