'use strict';

const secrets = require(__dirname+'/../configs/secrets.js')
	, { MongoClient, ObjectId, Int32, Binary } = require('mongodb')
	, { migrateVersion } = require(__dirname+'/../package.json')

module.exports = {

	connect: async () => {
		module.exports.client = new MongoClient(secrets.dbURL);
		await module.exports.client.connect();
		module.exports.db = module.exports.client.db(secrets.dbName);
	},

	//do i really want a separate fuckin file just for these? lol
	getConfig: () => {
		return module.exports.db.collection('globalsettings').findOne({ _id: 'globalsettings' });
	},

	setConfig: (newSettings) => {
		return module.exports.db.collection('globalsettings').replaceOne({ _id: 'globalsettings' }, newSettings, { upsert: true });
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

	Binary,

}
