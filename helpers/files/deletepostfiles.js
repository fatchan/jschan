'use strict';

const { remove } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js')

module.exports = (fileNames) => {

	//delete all the psot files and thumbs using the filenames
	return Promise.all(fileNames.map(async filename => {
		//dont question it.
		return Promise.all([
			remove(`${uploadDirectory}img/${filename}`),
			remove(`${uploadDirectory}img/thumb-${filename.split('.')[0]}.jpg`)
		]).catch(e => console.error) //ignore for now
	}));

}
