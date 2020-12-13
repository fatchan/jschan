'use strict';

module.exports = async(db, redis) => {
	console.log('add collection for board custompages');
	await db.createCollection('custompages');
	await db.collection('custompages').createIndex({ 'board': 1, 'url': 1 }, { unique: true });
};
