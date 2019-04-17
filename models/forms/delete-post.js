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

	//filter to threads, then get the board and thread for each 
	const boardThreads = posts.filter(x => x.thread == null).map(x => {
		return {
			board: x.board,
			thread: x.postId
		};
	});

	//get posts from all threads
	let threadPosts = []
	await Promise.all(boardThreads.map(async data => {
		const currentThreadPosts = await Posts.getThreadPosts(data.board, data.thread);
		threadPosts = threadPosts.concat(currentThreadPosts);
		return;
	}))

	//combine them all into one array
	const allPosts = posts.concat(threadPosts)

	//delete posts from DB
	const postMongoIds = allPosts.map(post => Mongo.ObjectId(post._id))
	const deletedPosts = await Posts.deleteMany(postMongoIds).then(result => result.deletedCount);

	//get filenames from all the posts
	let fileNames = [];
	allPosts.forEach(post => {
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
	return `Deleted ${boardThreads.length} threads and ${deletedPosts-boardThreads.length} posts`

}
