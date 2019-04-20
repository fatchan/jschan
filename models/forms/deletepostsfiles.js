'use strict';

const path = require('path')
	, util = require('util')
	, fs = require('fs')
	, unlink = util.promisify(fs.unlink)
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, hasPerms = require(__dirname+'/../../helpers/hasperms.js')
	, Mongo = require(__dirname+'/../../db/db.js')
	, Posts = require(__dirname+'/../../db/posts.js');

module.exports = async (req, res, next, posts) => {

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

	//delete posts from DB
	const postMongoIds = posts.map(post => Mongo.ObjectId(post._id))
	const deletedFilesPosts = await Posts.deleteFilesMany(postMongoIds).then(result => result.deletedCount);

	//hooray!
	return `Deleted ${fileNames.length} files across ${deletedFilesPosts} posts`

}
