'use strict';

module.exports = async(db) => {
	console.log('add collection for board custompages');
	await db.createCollection('custompages');
	await db.collection('custompages').createIndex({ 'board': 1, 'page': 1 }, { unique: true });
};
