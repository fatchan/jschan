'use strict';

module.exports = async(db) => {
	console.log('add unix time to posts for (u) links');
	await db.collection('posts').aggregate([
		{
			$project: {
				_id: '$_id',
				u: {
					$toDouble: '$date'
				}
			}
		}, {
			$merge: {
				into: 'posts'
			}
		}
	]).toArray();
	console.log('=\nNOTICE: 0.1.3 has updated nginx config, now using snippets for a more modular config that is easier to maintain. It is recommended to update these, refer to step 6 of INSTALLATION.\n=');
	console.log('=\nNOTICE: 0.1.3 now makes custom favicon generate easily and properly. Place your master image file in gulp/res/icons/master.png, then run "gulp generate-favicon && gulp icons"\n=');
};
