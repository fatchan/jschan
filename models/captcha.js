
'use strict';

const Mongo = require(__dirname+'/../helpers/db.js')
	, db = Mongo.client.db('captcha');

module.exports = {

	db,

	findOne: async (name) => {
		return db.collection('captcha').findOne({ '_id': name });
	},

	insertOne: async (data) => {
		return db.collection('captcha').insertOne(data);
	},

	deleteOne: async (data) => {
		return db.collection('captcha').deleteOne(data);
	},

	deleteAll: async () => {
		return db.collection('captcha').deleteMany({});
	},

}
