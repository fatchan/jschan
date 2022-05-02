'use strict';

module.exports = async(db) => {
	console.log('setting webring:false to boards');
	await db.collection('boards').updateMany({}, {
		'$set': {
			'webring': false,
		},
		'$rename': {
			'settings.tags': 'tags'
		}
	});
	await db.collection('boards').dropIndexes();
	await db.collection('boards').createIndex({ips: 1, pph:1, sequence_value:1});
	await db.collection('boards').createIndex({tags: 1});
	await db.collection('boards').createIndex({uri: 1});
	await db.collection('boards').createIndex({lastPostTimestamp:1});
	await db.dropCollection('webring');
};
