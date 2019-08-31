'use strict';

const uploadDirectory = require(__dirname+'/uploadDirectory.js')
	, gm = require('gm');

module.exports = (file, filename, folder) => {

	return new Promise((resolve, reject) => {
		gm(file.tempFilePath)
		.noProfile()
		.write(`${uploadDirectory}${folder}/${filename}`, function (err) {
			if (err) {
				return reject(err);
			}
			return resolve();
		});
	});

};
