'use strict';

const imageHash = require('imghash').hash
	, config = require(__dirname+'/../../misc/config.js');

module.exports = async (req, res, next) => {
	const { hashImages } = config.get;
	if (hashImages && res.locals.numFiles > 0) {
		const hashPromises = [];
		for (let i = 0; i < res.locals.numFiles; i++) {
			const mainType = req.files.file[i].mimetype.split('/')[0];
			if (mainType === 'image') {
				hashPromises.push(imageHash(req.files.file[i].tempFilePath, 8, 'hex').then(res => {
					req.files.file[i].phash = res;
				}));
			}
		}
		await Promise.all(hashPromises);
	}
	next();
}
