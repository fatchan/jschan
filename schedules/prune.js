'use strict';

const Files = require(__dirname+'/../db/files.js')
	, { remove } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../helpers/files/uploadDirectory.js');

module.exports = async() => {
	//todo: make this not a race condition, but it only happens daily so ¯\_(ツ)_/¯
	const files = await Files.db.find({
		'count': {
			'$lt': 1
		}
	}, {
		'projection': {
			'count': 0,
			'size': 0
		}
	}).toArray()
	await Files.db.removeMany({
		'count': {
			'$lte': 0
		}
	});
	await Promise.all(files.map(async file => {
		return Promise.all(
			[remove(`${uploadDirectory}/img/${file._id}`)]
			.concat(file.exts.filter(ext => ext).map(ext => {
				remove(`${uploadDirectory}/img/thumb-${file._id.split('.')[0]}${ext}`)
			}))
		)
	}));
}
