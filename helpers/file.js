'use strict';
const isValidFile = require(__dirname+'/filefilter.js')
	, path = require('path')
	, uploadDest = path.join(__dirname, '/../static/img/')
	, uuidv4 = require('uuid/v4')
	, gm = require('@tohru/gm');

module.exports = {

	uploadDest,

	uploadAndThumb: (req, res) => {
		return new Promise((resolve, reject) => {
			const file = req.files.file;
			//check type
			if (!isValidFile(file)) {
				return reject(new Error('Unsupported file type'))
			}
			//save it
			const filename = uuidv4() + path.extname(file.name);
			file.mv(uploadDest + filename, function (err) {
				if (err) {
					return reject(err);
				}
				//thumbnail it
				gm(uploadDest + filename)
					.resize(128, 128)
					.noProfile()
					.write(uploadDest + 'thumb-' + filename, function (err) {
					if (err) {
						return reject(err);
					}
					return resolve(filename);
				});
			});
		});
	},

};
