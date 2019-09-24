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
	}).toArray().then(res => {
		return res.map(x => x._id);
	});
	await Files.db.removeMany({
		'count': {
			'$lte': 0
		}
	});
	await Promise.all(files.map(async filename => {
		return Promise.all([
			remove(`${uploadDirectory}img/${filename}`),
			remove(`${uploadDirectory}img/thumb-${filename.split('.')[0]}.jpg`)
		])
	}));
}
