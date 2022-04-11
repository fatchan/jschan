'use strict';

const hashIp = require(__dirname+'/../lib/haship.js');

module.exports = async(db, redis) => {
	console.log('update moglog postids to postlinks');
	await db.collection('modlog').updateMany({},
		[{
			$addFields: {
				postLinks: [
					{
						$arrayToObject: {
							$map: {
								input: "$postIds",
								as: 'postId',
								in: {
									k: 'postId',
									v: '$$postId'
								}
							}
						}
					}
				]
			}
		}
	]);
	await db.collection('modlog').updateMany({}, {
		'$unset': {
			'postIds': ''
		},
		'$set': {
			'showLinks': false
		}
	});
};
