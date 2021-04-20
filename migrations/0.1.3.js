'use strict';

module.exports = async(db, redis) => {
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
	console.log('=\nHEY, you should update your nginx configs. 0.1.3 had some nginx config changes to support new favicon location and gulp task. Refer to step 6 of README if you forgot how\n=')
};
