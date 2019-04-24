'use strict';

const configs = require(__dirname+'/../../configs/main.json')
	, uploadDirectory = require(__dirname+'/../uploadDirectory.js');

module.exports = (req, res, file, filename, folder) => {

	return new Promise((resolve, reject) => {
		file.mv(`${uploadDirectory}${folder}/${filename}`, function (err) {
			if (err) {
				return reject(err);
			}
			return resolve()
		});
	});

};
