'use strict';

const path = require('path')
	, util = require('util')
	, fs = require('fs')
	, unlink = util.promisify(fs.unlink)
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
    , Posts = require(__dirname+'/../../db-models/posts.js');

module.exports = async (req, res) => {
	//get all posts that were checked
	let posts;
	try {
		posts = await Posts.getPosts(req.params.board, req.body.checked, true); //admin arument true, fetches passwords and salts
	} catch (err) {
		console.error(err);
		return res.status(500).render('error');
	}

	//filter it to ones that match the password
	posts = posts.filter(post => post.password == req.body.password);

	if (posts.length > 0) {

		const threadIds = posts.filter(x => x.thread == null).map(x => x._id);

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
		try {
			const result = await Posts.deleteMany(req.params.board, allPosts.map(x => x._id));
			deletedPosts = result.deletedCount;
		} catch (err) {
			console.error(err);
			return res.status(500).render('error');
		}

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
		return res.render('message', {
			'title': 'Success',
			'message': `Deleted ${threadIds.length} threads and ${deletedPosts} posts`,
			'redirect': `/${req.params.board}`
		});

	}

	return res.status(403).render('message', {
		'title': 'Forbidden',
		'message': 'Password did not match any selected posts',
		'redirect': `/${req.params.board}`
	});

}
