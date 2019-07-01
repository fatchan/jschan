'use strict';

const uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, { remove } = require('fs-extra')
	, Mongo = require(__dirname+'/../../db/db.js')
	, Posts = require(__dirname+'/../../db/posts.js')

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

	//get files for ref counting, backlinks for post re-markup, mongoids for deleting
	const { postFiles, postBacklinks, postMongoIds } = allPosts.reduce((acc, post) => {
		if (post.files.length > 0) {
			acc.postFiles = acc.postFiles.concat(post.files);
		}
		if (post.backlinks.length > 0) {
			acc.postBacklinks = acc.postBacklinks.concat(post.backlinks);
		}
		acc.postMongoIds.push(post._id);
		return acc;
	}, { postFiles: [], postBacklinks: [], postMongoIds: [] });

	//is there a nicer way to do this
	const bulkWrites = [];
	for (let j = 0; j < allPosts.length; j++) {
		const post = allPosts[j];
		for (let i = 0; i < post.quotes.length; i++) {
			const quote = post.quotes[i];
			//remove the backlink to this post from any post that it quoted
			bulkWrites.push({
				'updateOne': {
					'filter': {
						'_id': quote._id
					},
					'update': {
						'$pull': {
							'backlinks': {
								'postId': post.postId
							}
						}
					}
				}
			});
		}
	}
	await Posts.db.bulkWrite(bulkWrites);

//TODO: remarkup to unlink quotes in posts that quote deleted posts
//TODO: file ref counting decrement, oncei implement counting in make post

	const deletedPosts = await Posts.deleteMany(postMongoIds).then(result => result.deletedCount);

	//hooray!
	return { action: deletedPosts > 0, message:`Deleted ${threads.length} threads and ${deletedPosts-threads.length} posts` };

}
