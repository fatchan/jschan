'use strict';
const multer = require('multer')
	, fileFilter = require(__dirname+'/filefilter.js')
	, path = require('path')
	, uploadDest = path.join(__dirname, '/../static/img/')
	, uuidv4 = require('uuid/v4')
	, storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, uploadDest)
		},
		filename: function (req, file, cb) {
			cb(null, uuidv4() + path.extname(file.originalname))
		}
	})
	, upload = multer({
		storage: storage,
		limits: { fileSize: 1 * 1024 * 1024 }, //1MB for now
		fileFilter: fileFilter
	}).single('file')
	, gm = require('@tohru/gm');

module.exports = {

	upload,

	uploadDest,

	uploadAndThumb: (req, res) => {
		return new Promise((resolve, reject) => {
			upload(req, res, function (err) {
				if (err) {
					return reject(err)
				}
				if (req.file) {
					//thumbnail it
					gm(uploadDest+req.file.filename)
						.resize(128, 128)
						.noProfile()
						.write(uploadDest+'thumb-'+req.file.filename, function (err) {
						if (err) {
							return reject(err);
						}
						return resolve()
					});
				}
			});
		});
	},

};
