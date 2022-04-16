'use strict';

const { Posts } = require(__dirname+'/../../db/');

module.exports = async (posts, deleting) => {

	//get a map of boards to threads affected
	const boardThreadMap = {};
	for (let i = 0; i < posts.length; i++) {
		const post = posts[i];
		if (!boardThreadMap[post.board]) {
			boardThreadMap[post.board] = {
				'directThreads': new Set(),
				'threads': new Set()
			};
		}
		if (!post.thread) {
			//a thread was directly selected on this board, not just posts. so we handle deletes differently
			boardThreadMap[post.board].directThreads.add(post.postId);
		}
		const threadId = post.thread || post.postId;
		boardThreadMap[post.board].threads.add(threadId);
	}

	const numPagesBeforeActions = {};
	const affectedBoardNames = Object.keys(boardThreadMap);
	//get number of pages for each before actions for deleting old pages and changing page nav numbers incase number of pages changes
	if (deleting) {
		await Promise.all(affectedBoardNames.map(async board => {
			numPagesBeforeActions[board] = Math.ceil((await Posts.getPages(board)) / 10);
		}));
	}

	return { boardThreadMap, numPagesBeforeActions, affectedBoardNames };

}
