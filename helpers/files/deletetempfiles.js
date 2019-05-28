'use strict';

const remove = require('fs-extra').remove;

module.exports = async (files) => {

	return Promise.all(files.map(async file => {
		remove(file.tempFilePath);
	}));

}
