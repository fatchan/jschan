'use strict';

const path = require('path')
	, util = require('util')
	, fs = require('fs')
	, unlink = util.promisify(fs.unlink)
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, hasPerms = require(__dirname+'/../../helpers/hasperms.js')
	, Mongo = require(__dirname+'/../../db/db.js')
	, Posts = require(__dirname+'/../../db/posts.js');

module.exports = async (req, res, next, checkedPosts) => {

	let posts = checkedPosts;

	//if user is not logged in OR if lgoged in but not authed, filter the posts by passwords that are not null
	if (!hasPerms(req, res)) {
		// filter posts by password only if NOT board moderator or owner
		posts = posts.filter(post => {
			// only include posts that have a password and that matches
			return post.password != null
			&& post.password.length > 0
			&& post.password == req.body.password
		});
		if (posts.length === 0) {
			throw {
				'status': 403,
				'message': {
					'title': 'Forbidden',
					'message': 'Password did not match any selected posts',
					'redirect': `/${req.params.board}`
				}
			};
		}
	}

	//delete posts from DB
	const postMongoIds = posts.map(post => Mongo.ObjectId(post._id))
	const deletedFilesPosts = await Posts.deleteFilesMany(postMongoIds).then(result => result.deletedCount);

	//get filenames from all the posts
	let fileNames = [];
	posts.forEach(post => {
		fileNames = fileNames.concat(post.files.map(x => x.filename))
	})

	//delete all the files using the filenames
	await Promise.all(fileNames.map(async filename => {
		//dont question it.
		return Promise.all([
			unlink(uploadDirectory + filename),
			unlink(`${uploadDirectory}thumb-${filename.split('.')[0]}.png`)
		])
	}));

	//hooray!
	return `Deleted ${fileNames.length} files across ${deletedFilesPosts} posts`

}
