'use strict';

module.exports = async(db) => {

	console.log('Updating all bans to have new global true/false flag');
	await db.collection('bans').updateMany({
		board: null,
	}, {
		'$set': {
			'global': true,
		},
	});

	await db.collection('bans').updateMany({
		board: {
			'$ne': null,
		},
	}, {
		'$set': {
			'global': false,
		},
	});

};
