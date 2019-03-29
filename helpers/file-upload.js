'use strict';

const configs = require(__dirname+'/../configs/main.json')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js');

module.exports = (req, res, filename) => {

	return new Promise((resolve, reject) => {
		const file = req.files.file;
		file.mv(uploadDirectory + filename, function (err) {
			if (err) {
				return reject(err);
			}
			return resolve()
		});
	});

};
