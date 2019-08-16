'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('captcha');

module.exports = {

	db,

	findOne: (id) => {
		return captcha.findOne({ '_id': id });
	},

	insertOne: (text) => {
		return captcha.insertOne({
			'text': text,
			'expireAt': new Date()
		});
	},

	findOneAndDelete: (id, text) => {
		return captcha.findOneAndDelete({
			'_id': id,
			'text': text
		});
	},

	deleteAll: () => {
		return captcha.deleteMany({});
	},

}
