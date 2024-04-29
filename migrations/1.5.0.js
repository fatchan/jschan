'use strict';

module.exports = async(db) => {

	console.log('Updating all bans with board: null to be global true');
	await db.collection('bans').updateMany({
		board: null,
	}, {
		'$set': {
			'global': true,
		},
	});

};
