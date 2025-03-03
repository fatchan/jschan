'use strict';

module.exports = async(db, redis) => {

	console.log('createing nftrules collection');
	await db.createCollection('nftrules');
	await db.collection('nftrules').createIndex({ 'board': 1 });

	console.log('Clearing globalsettings and boards cache');
	await redis.deletePattern('globalsettings');
	await redis.deletePattern('board:*');
	await redis.deletePattern('nftrules:*');

};
