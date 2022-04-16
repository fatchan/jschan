'use strict';

const uploadDirectory = require(__dirname+'/uploaddirectory.js');

module.exports = (file, filename, folder) => {

	return new Promise((resolve, reject) => {
		file.mv(`${uploadDirectory}/${folder}/${filename}`, function (err) {
			if (err) {
				return reject(err);
			}
			return resolve();
		});
	});

};
