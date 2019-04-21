'use strict';

const path = require('path')
	, util = require('util')
	, fs = require('fs')
	, unlink = util.promisify(fs.unlink)
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')

module.exports = async (posts) => {

	//get filenames from all the posts
	let fileNames = [];
	posts.forEach(post => {
		fileNames = fileNames.concat(post.files.map(x => x.filename))
	})

	if (fileNames.length === 0) {
		return {
			message: 'No files to delete'
		}
	}

	//delete all the files using the filenames
	await Promise.all(fileNames.map(async filename => {
		//dont question it.
		return Promise.all([
			unlink(uploadDirectory + filename),
			unlink(`${uploadDirectory}thumb-${filename.split('.')[0]}.png`)
		])
	}));

	return {
		message:`Deleted ${fileNames.length} file(s) across ${posts.length} post(s)`,
		action:'$set',
		query: {
			'files': []
		}
	};

}
