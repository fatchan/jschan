'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('captcha');

module.exports = {

	db,

	findOne: (id) => {
		return db.findOne({ '_id': id });
	},

	insertOne: (answer) => {
		return db.insertOne({
			'answer': answer,
			'expireAt': new Date()
		});
	},

	findOneAndDelete: (id, answer) => {
		return db.findOneAndDelete({
			'_id': id,
			'answer': answer
		});
	},

	randomSample: () => {
		return db.aggregate([
			{
				$sample: { size: 1 }
			}
		]).toArray().then(res => res[0]);
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

}
