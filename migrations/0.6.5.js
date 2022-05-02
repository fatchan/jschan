'use strict';

module.exports = async(db) => {

	console.log('remove older phashes');
	await db.collection('posts').updateMany({}, {
		'$unset': {
			'files.$[].phash': ''
		}
	});

};
