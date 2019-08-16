'use strict';

const { MongoClient, ObjectId, Int32 } = require('mongodb')
	, configs = require(__dirname+'/../configs/main.json');

module.exports = {

	connect: async () => {
		if (module.exports.client) {
			throw new Error('Mongo already connected');
		}
		module.exports.client = await MongoClient.connect(configs.dbURL, {
			useNewUrlParser: true,
			useUnifiedTopology: true
		});
	},

	ObjectId,

	NumberInt: Int32,

}
