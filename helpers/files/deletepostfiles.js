'use strict';

const util = require('util')
	, fs = require('fs')
	, unlink = util.promisify(fs.unlink)
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')

module.exports = (fileNames) => {

	//delete all the psot files and thumbs using the filenames
	return Promise.all(fileNames.map(async filename => {
		//dont question it.
		return Promise.all([
			unlink(`${uploadDirectory}img/${filename}`),
			unlink(`${uploadDirectory}img/thumb-${filename.split('.')[0]}.jpg`)
		]).catch(e => console.error) //ignore for now
	}));

}
