'use strict';

module.exports = async(db) => {

	console.log('Updating modlogs to add public flag');
	await db.collection('modlog').updateMany({}, {
		'$set': {
			'public': true,
		},
	});

};
