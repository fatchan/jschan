'use strict';

const { remove } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/uploaddirectory.js');

module.exports = async (filenames, folder) => {

	await Promise.all(filenames.map(async filename => {
		remove(`${uploadDirectory}/${folder}/${filename}`)
	}));

}
