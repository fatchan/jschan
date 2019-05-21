'use strict';

const remove = require('fs-extra').remove
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js');

module.exports = async (filenames, folder) => {

	await Promise.all(filenames.map(async filename => {
		remove(`${uploadDirectory}${folder}/${filename}`)
	}));

}
