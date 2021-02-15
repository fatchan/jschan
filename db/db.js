'use strict';

const secrets = require(__dirname+'/../configs/secrets.js')
	, { MongoClient, ObjectId, Int32 } = require('mongodb')
	, { version } = require(__dirname+'/../package.json')

module.exports = {

	connect: async () => {
		if (module.exports.client) {
			throw new Error('Mongo already connected');
		}
		module.exports.client = await MongoClient.connect(secrets.dbURL, {
			useNewUrlParser: true,
			useUnifiedTopology: true
		});
		module.exports.db = module.exports.client.db(secrets.dbName);
	},

	checkVersion: async() => {
		const currentVersion = await module.exports.db
			.collection('version')
			.findOne({ '_id': 'version' })
			.then(res => res.version);
		if (currentVersion < version) {
			console.error('Your migration version is out-of-date. Run `gulp migrate` to update.');
			process.exit(1);
		}
	},

	ObjectId,

	NumberInt: Int32,

}
