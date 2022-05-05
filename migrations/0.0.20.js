'use strict';

const fs = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../lib/file/uploaddirectory.js');

module.exports = async(db) => {
	console.log('put thumbs in a folder');
	await fs.ensureDir(`${uploadDirectory}/file/thumb/`);
	await db.collection('files')
		.find()
		.forEach(async file => {
			const [hash] = file._id.split('.');
			file.exts.forEach(ext => {
				fs.moveSync(`${uploadDirectory}/file/thumb-${hash}${ext}`, `${uploadDirectory}/file/thumb/${hash}${ext}`);
			});
		});
};
