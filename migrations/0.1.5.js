'use strict';

const config = require(__dirname+'/../lib/misc/config.js')
	, fs = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../lib/file/uploaddirectory.js');

module.exports = async(db, redis) => {
	console.log('Adding assets');
	await fs.ensureDir(`${uploadDirectory}/asset/`);
	const template = require(__dirname+'/../configs/template.js.example');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'globalLimits.assetFiles': template.globalLimits.assetFiles,
			'globalLimits.assetFilesSize': template.globalLimits.assetFilesSize,
		},
	});
	await db.collection('boards').updateMany({}, {
		'$set': {
			'assets': [],
		},
	});
	console.log('Cleared boards cache');
	await redis.deletePattern('board:*');
	console.log('Cleared globalsettings cache');
	await redis.deletePattern('globalsettings');
};
