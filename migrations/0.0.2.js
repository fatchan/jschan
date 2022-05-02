'use strict';

module.exports = async(db) => {
	console.log('Renaming IP fields on posts');
	await db.collection('posts').updateMany({}, {
		'$rename': {
			'ip.hash': 'ip.single'
		}
	});
};
