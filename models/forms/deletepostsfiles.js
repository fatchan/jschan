'use strict';

const { Files } = require(__dirname+'/../../db/')
	, deletePostFiles = require(__dirname+'/../../helpers/files/deletepostfiles.js');

module.exports = async (posts, unlinkOnly) => {

	//get filenames from all the posts
	let files = [];
	for (let i = 0; i < posts.length; i++) {
		const post = posts[i];
		if (post.files.length > 0) {
			files = files.concat(post.files.map(file => {
				return {
					filename: file.filename,
					hash: file.hash
				};
			}));
		}
	}
	files = [...new Set(files)];

	if (files.length == 0) {
		return {
			 message: 'No files found'
		};
	}

	if (files.length > 0) {
        await Files.decrement(files.map(x => x.filename));
	}

	if (unlinkOnly) {
		return {
			message:`Unlinked ${files.length} file(s) across ${posts.length} post(s)`,
			action:'$set',
			query: {
				'files': []
			}
		};
	} else {
		//delete all the files
		await deletePostFiles(files);
		return {
			message:`Deleted ${files.length} file(s) from server`,
			//NOTE: only deletes from selected posts. other posts with same image will 404
			action:'$set',
			query: {
				'files': []
			}
		};
	}

}
