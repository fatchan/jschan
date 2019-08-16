'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('captcha');

module.exports = {

	db,

	findOne: (id) => {
		return db.findOne({ '_id': id });
	},

	insertOne: (text) => {
		return db.insertOne({
			'text': text,
			'expireAt': new Date()
		});
	},

	findOneAndDelete: (id, text) => {
		return db.findOneAndDelete({
			'_id': id,
			'text': text
		});
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

}
