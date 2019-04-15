'use strict';

const { MongoClient, ObjectId } = require('mongodb')
	, configs = require(__dirname+'/../configs/main.json');

module.exports = {

	connect: async () => {
		if (module.exports.client) {
			throw new Error('Mongo already connected');
		}
		module.exports.client = await MongoClient.connect(configs.dbURL, { useNewUrlParser: true });
	},

	ObjectId

}
