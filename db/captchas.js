'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.db.collection('captcha');

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
		]).toArray();
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

};
