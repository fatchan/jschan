'use strict';

const uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, deletePostFiles = require(__dirname+'/../../helpers/files/deletepostfiles.js')
	, remove = require('fs-extra').remove
	, Mongo = require(__dirname+'/../../db/db.js')
	, Posts = require(__dirname+'/../../db/posts.js');

module.exports = async (req, res, next, posts, board) => {

	//filter to threads
	const threads = posts.filter(x => x.thread == null);

	//delete the html for threads
	const deleteHTML = []
	for (let i = 0; i < threads.length; i++) {
		deleteHTML.push(remove(`${uploadDirectory}html/${threads[i].board}/thread/${threads[i].postId}.html`));
	}
	await Promise.all(deleteHTML);

	//get posts from all threads
	let threadPosts = []
	if (threads.length > 0) {
		if (board) {
			//if this is board-specific, we can use a single query
			const threadPostIds = threads.map(thread => thread.postId);
			threadPosts = await Posts.getMultipleThreadPosts(board, threadPostIds);
		} else {
			//otherwise we fetch posts from threads on different boards separarely
			//TODO: combine queries from the same board, or ideally construct a large $or query so this can be tackled in a single db query
			await Promise.all(threads.map(async thread => {
				//for each thread, fetch all posts from the matching board and thread matching the threads postId
				const currentThreadPosts = await Posts.getThreadPosts(thread.board, thread.postId);
				threadPosts = threadPosts.concat(currentThreadPosts);
			}));
		}
	}

	//combine them all into one array, there may be duplicates but it shouldnt matter
	const allPosts = posts.concat(threadPosts)

	//delete posts from DB
	const postMongoIds = allPosts.map(post => Mongo.ObjectId(post._id))
	const deletedPosts = await Posts.deleteMany(postMongoIds).then(result => result.deletedCount);

	//get filenames from all the posts
	let fileNames = [];
	allPosts.forEach(post => {
		fileNames = fileNames.concat(post.files.map(x => x.filename))
	})

	//delete post files
	if (fileNames.length > 0) {
		await deletePostFiles(fileNames);
	}

	//hooray!
	return { message:`Deleted ${threads.length} threads and ${deletedPosts-threads.length} posts` };

}
