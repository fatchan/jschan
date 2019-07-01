'use strict';

const uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, { remove } = require('fs-extra')
	, Mongo = require(__dirname+'/../../db/db.js')
	, Posts = require(__dirname+'/../../db/posts.js');

module.exports = async (posts, board) => {

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
			//TODO: use bulkwrite or construct a large $or query so this can be tackled in a single db query
			await Promise.all(threads.map(async thread => {
				//for each thread, fetch all posts from the matching board and thread matching the threads postId
				const currentThreadPosts = await Posts.getThreadPosts(thread.board, thread.postId);
				threadPosts = threadPosts.concat(currentThreadPosts);
			}));
		}
	}

	//combine them all into one array, there may be duplicates but it shouldnt matter
	const allPosts = posts.concat(threadPosts);

//NOTE: this is where, when implemented, file ref counts would be decremented
//NOTE: this is where, when implemented, re-marking up posts that quoted deleted posts would be done
//could use a destructuring with Array.reduce when i need to get files array, backlinks array and mongoId array
//instead of doing 3 maps or big for loop

	//get all mongoids and delete posts from
	const postMongoIds = allPosts.map(post => Mongo.ObjectId(post._id));
	const deletedPosts = await Posts.deleteMany(postMongoIds).then(result => result.deletedCount);

	//hooray!
	return { action: deletedPosts > 0, message:`Deleted ${threads.length} threads and ${deletedPosts-threads.length} posts` };

}
