'use strict';

const { stat, remove, readdir } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/uploaddirectory.js');

//takes directory name and timestamp to delete files older than
module.exports = async (directory, olderThan) => {
	const dir = `${uploadDirectory}/${directory}`;
	const files = await readdir(dir);
	if (files.length > 0) {
		return Promise.all(files.map(async file => {
			const filePath = `${dir}/${file}`;
			try {
				const stats = await stat(filePath);
				const expiry = new Date(olderThan).getTime();
				if (stats.ctime.getTime() < expiry) {
					await remove(filePath);
				}
			} catch (e) {
				console.error(e);
			}
		}));
	}
};
