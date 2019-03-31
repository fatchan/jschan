'use strict';

const configs = require(__dirname+'/../configs/main.json')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js');

module.exports = (req, res, file, filename) => {

	return new Promise((resolve, reject) => {
		file.mv(uploadDirectory + filename, function (err) {
			if (err) {
				return reject(err);
			}
			return resolve()
		});
	});

};
