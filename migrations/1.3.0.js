'use strict';

module.exports = async(db, redis) => {

	console.log('Updating globalsettings to add web3 settings');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'enableWeb3': false,
			'ethereumLinksURL': 'https://etherscan.io/address/%s',
		},
	});

	console.log('Updating boards to add web3 settings');
	await db.collection('boards').updateMany({}, {
		'$set': {
			'enableWeb3': false,
		},
	});
	
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('Clearing boards cache');
	await redis.deletePattern('board:*');

};
