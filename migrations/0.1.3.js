'use strict';

module.exports = async(db, redis) => {
	console.log('add u to posts');
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
};
