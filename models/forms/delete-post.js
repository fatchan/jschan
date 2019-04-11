'use strict';

const path = require('path')
	, util = require('util')
	, fs = require('fs')
	, unlink = util.promisify(fs.unlink)
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, hasPerms = require(__dirname+'/../../helpers/has-perms.js')
	, Posts = require(__dirname+'/../../db-models/posts.js');

module.exports = async (req, res) => {

	//get all posts that were checked
	let posts = await Posts.getPosts(req.params.board, req.body.checked, true); //admin arument true, fetches passwords and salts

	if (!posts || posts.length === 0) {
		throw {
            'status': 400,
            'message': {
                'title': 'Bad request',
                'message': 'No posts found',
                'redirect': `/${req.params.board}`
            }
        };
	}

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

	const threadIds = posts.filter(x => x.thread == null).map(x => x.postId);

	//get posts from all threads
	let threadPosts = []
	await Promise.all(threadIds.map(async id => {
		const currentThreadPosts = await Posts.getThreadPosts(req.params.board, id);
		threadPosts = threadPosts.concat(currentThreadPosts);
		return;
	}))

	//combine them all into one array
	const allPosts = posts.concat(threadPosts)

	//delete posts from DB
	let deletedPosts = 0;
	const result = await Posts.deleteMany(req.params.board, allPosts.map(x => x.postId));
	deletedPosts = result.deletedCount;

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
			unlink(uploadDirectory + 'thumb-' + filename)
		])
	}));

	//hooray!
	return `Deleted ${threadIds.length} threads and ${deletedPosts} posts`

}
