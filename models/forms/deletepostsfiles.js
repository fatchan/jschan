'use strict';

const { remove } = require('fs-extra')
	, { Files } = require(__dirname+'/../../db/')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')

module.exports = async (posts, unlinkOnly) => {

	//get filenames from all the posts
	let fileNames = [];
	for (let i = 0; i < posts.length; i++) {
		const post = posts[i];
		if (post.files.length > 0) {
			fileNames = fileNames.concat(post.files.map(x => x.filename));
		}
	}
	fileNames = [...new Set(fileNames)];

	if (fileNames.length == 0) {
		return {
			 message: 'No files found'
		};
	}

	if (fileNames.length > 0) {
        await Files.decrement(fileNames);
	}

	if (unlinkOnly) {
		return {
			message:`Unlinked ${fileNames.length} file(s) across ${posts.length} post(s)`,
			action:'$set',
			query: {
				'files': []
			}
		};
	} else {
		//delete all the files using the filenames
		await Promise.all(fileNames.map(async filename => {
			//dont question it.
			return Promise.all([
				remove(`${uploadDirectory}img/${filename}`),
				remove(`${uploadDirectory}img/thumb-${filename.split('.')[0]}.jpg`)
			])
		}));
		return {
			message:`Deleted ${fileNames.length} file(s) from server`,
		};
	}

}
