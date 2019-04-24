'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('captchas');

module.exports = {

	db,

	findOne: (id) => {
		return db.findOne({ '_id': id });
	},

	insertOne: (text) => {
		return db.insertOne({
			'text': text,
			'expireAt': new Date((new Date).getTime() + (5*1000*60)) //5 minute expiration
		});
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

}
