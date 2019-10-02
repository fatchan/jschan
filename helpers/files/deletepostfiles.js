'use strict';

const { remove } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js')

module.exports = (files) => {

	//delete all the files and thumbs
	return Promise.all(files.map(async file => {
		return Promise.all(
			[remove(`${uploadDirectory}/img/${file.filename}`)]
			.concat(file.exts.map(ext => {
				remove(`${uploadDirectory}/img/thumb-${file.hash}${file.thumbextension}`)
			}))
		).catch(e => console.error)
	}));

}
