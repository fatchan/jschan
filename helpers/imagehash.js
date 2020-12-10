'use strict';

const imageHash = require('node-image-hash').hash
	, { hashImages } = require(__dirname+'/../configs/main.js');

module.exports = async (req, res, next) => {
	if (hashImages && res.locals.numFiles > 0 && res.locals.permLevel > 1) {
		const hashPromises = [];
		for (let i = 0; i < res.locals.numFiles; i++) {
			const mainType = req.files.file[i].mimetype.split('/')[0];
			if (mainType === 'image' || mainType === 'video') {
				hashPromises.push(imageHash(req.files.file[i].tempFilePath, 8, 'hex').then(res => {
					console.log(res.hash);
					req.files.file[i].phash = res.hash;
				}));
			}
		}
		await Promise.all(hashPromises);
	}
	next();
}
