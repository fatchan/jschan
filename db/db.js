'use strict';

const configs = require(__dirname+'/../getconfig.js')()
	, { MongoClient, ObjectId, Int32 } = require('mongodb')
	, { migrateVersion } = require(__dirname+'/../package.json')

module.exports = {

	connect: async () => {
		if (module.exports.client) {
			throw new Error('Mongo already connected');
		}
		module.exports.client = await MongoClient.connect(configs.dbURL, {
			useNewUrlParser: true,
			useUnifiedTopology: true
		});
		module.exports.db = module.exports.client.db(configs.dbName);
	},

	checkVersion: async() => {
		const currentVersion = await module.exports.db
			.collection('version')
			.findOne({ '_id': 'version' })
			.then(res => res.version);
		if (currentVersion < migrateVersion) {
			console.error('Your migration version is out-of-date. Run `gulp migrate` to update.');
			process.exit(1);
		}
	},

	ObjectId,

	NumberInt: Int32,

}
