'use strict';

const Files = require(__dirname+'/../db/files.js')
	, { debugLogs } =  require(__dirname+'/../configs/main.js')
	, { remove } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../helpers/files/uploadDirectory.js');

module.exports = async(fileNames) => {
	const query = {
		'count': {
			'$lte': 1
		}
	}
	if (fileNames) {
		query['_id'] = {
			'$in': fileNames
		};
	}
	const unreferenced = await Files.db.find(query, {
		'projection': {
			'count': 0,
			'size': 0
		}
	}).toArray();
	await Files.db.removeMany(query);
	await Promise.all(unreferenced.map(async file => {
		debugLogs && console.log('Pruning', file._id);
		return Promise.all(
			[remove(`${uploadDirectory}/img/${file._id}`)]
			.concat(file.exts ? file.exts.filter(ext => ext).map(ext => {
				remove(`${uploadDirectory}/img/thumb-${file._id.split('.')[0]}${ext}`)
			}) : [])
		)
	}));
}
