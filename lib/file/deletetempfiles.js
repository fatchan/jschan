'use strict';

const { remove } = require('fs-extra');

module.exports = async (req) => {

	if (req.files != null) {
		let files = [];
		const keys = Object.keys(req.files);
		for (let i = 0; i < keys.length; i++) {
			const val = req.files[keys[i]];
			if (Array.isArray(val)) {
				files = files.concat(val);
			} else {
				files.push(val);
			}
		}
		return Promise.all(files.map(async file => {
			remove(file.tempFilePath);
		}));
	}

};
