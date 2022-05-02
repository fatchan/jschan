'use strict';

module.exports = async(db) => {
	console.log('Creating bypass collection');
	await db.createCollection('bypass');
	console.log('Creating bypass collection index');
	await db.collection('bypass').createIndex({ 'expireAt': 1 }, { expireAfterSeconds: 0 });
};
