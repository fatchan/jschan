'use strict';

const path = require('path')
	, util = require('util')
	, fs = require('fs')
	, unlink = util.promisify(fs.unlink)
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js');

module.exports = async (filenames, folder) => {

	await Promise.all(filenames.map(async filename => {
		unlink(`${uploadDirectory}${folder}/${filename}`)
	}));

}
