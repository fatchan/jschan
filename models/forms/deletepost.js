'use strict';

const uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, { remove } = require('fs-extra')
	, Mongo = require(__dirname+'/../../db/db.js')
	, { Posts, Files } = require(__dirname+'/../../db/')
	, Socketio = require(__dirname+'/../../socketio.js')
	, quoteHandler = require(__dirname+'/../../helpers/posting/quotes.js')
	, { markdown } = require(__dirname+'/../../helpers/posting/markdown.js')
	, config = require(__dirname+'/../../config.js')
	, { func: pruneFiles } = require(__dirname+'/../../schedules/tasks/prune.js')
	, sanitize = require('sanitize-html')
	, sanitizeOptions = require(__dirname+'/../../helpers/posting/sanitizeoptions.js');

module.exports = async (posts, board, all=false) => {

	const { pruneImmediately } = config.get;

	//filter to threads
	const threads = posts.filter(x => x.thread == null);

	//emits not including the fetched posts from next block because those are based on threads being selected
	//and we dont need to send delete message for every reply in a thread when the OP gets deleted.
	const deleteEmits = posts.reduce((acc, post) => {
		acc.push({
			room: `${post.board}-${post.thread || post.postId}`,
			postId: post.postId,
		});
		return acc;
	}, []);

	//get posts from all threads
	let threadPosts = []
	if (all === false && threads.length > 0) {
		if (board) {
			//if this is board-specific, we can use a single query
			const threadPostIds = threads.map(thread => thread.postId);
			threadPosts = await Posts.getMultipleThreadPosts(board, threadPostIds);
		} else {
			//otherwise we fetch posts from threads on different boards separarely
			//TODO: use big board:$or/postid:$in query so this can be tackled in a single db query
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

	if (postFiles.length > 0) {
		const fileNames = postFiles.map(x => x.filename)//[...new Set(postFiles.map(x => x.filename))];
		await Files.decrement(fileNames);
		if (pruneImmediately) {
			await pruneFiles(fileNames);
		}
	}

	const bulkWrites = [];
	const backlinkRebuilds = new Set();
	if (all === false) { //no need to rebuild quotes when deleting all posts for a board
		const deleteThreadMap = {};
		for (let i = 0; i < threads.length; i++) {
			const thread = threads[i];
			//if exists, add to set, else make the set
			if (!deleteThreadMap[thread.board]) {
				 deleteThreadMap[thread.board] = new Set();
			}
			deleteThreadMap[thread.board].add(thread.postId);
		}
		for (let j = 0; j < allPosts.length; j++) {
			const post = allPosts[j];
			backlinkRebuilds.delete(post._id); //make sure we dont try and remarkup this post since its getting deleted.
			if (post.thread != null && !deleteThreadMap[post.board] || !deleteThreadMap[post.board].has(post.thread)) {
				//get backlinks for posts to remarkup
				for (let i = 0; i < post.backlinks.length; i++) {
					backlinkRebuilds.add(post.backlinks[i]._id);
				}
				//remove dead backlinks to this post
				if (post.quotes.length > 0) {
					bulkWrites.push({
						'updateMany': {
							'filter': {
								'_id': {
									'$in': post.quotes.map(q => q._id)
								}
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
		}
	}

	//deleting before remarkup so quotes are accurate
	const deletedPosts = await Posts.deleteMany(postMongoIds).then(result => result.deletedCount);
	//emit the deletes to thread sockets (not recent sockets [yet?])
	for (let i = 0; i < deleteEmits.length; i++) {
		Socketio.emitRoom(deleteEmits[i].room, 'markPost', { postId: deleteEmits[i].postId, type: 'delete', mark: 'Deleted' });
	}

	if (all === false) {
		//get posts that quoted deleted posts so we can remarkup them
		if (backlinkRebuilds.size > 0) {
			const remarkupPosts = await Posts.globalGetPosts([...backlinkRebuilds]);
			await Promise.all(remarkupPosts.map(async post => { //doing these all at once
				if (post.nomarkup && post.nomarkup.length > 0) { //is this check even necessary? how would it have a quote with no message
					//redo the markup
					let message = markdown(post.nomarkup);
					const { quotedMessage, threadQuotes, crossQuotes } = await quoteHandler.process(post.board, message, post.thread);
					message = sanitize(quotedMessage, sanitizeOptions.after);
					bulkWrites.push({
						'updateOne': {
							'filter': {
								'_id': post._id
							},
							'update': {
								'$set': {
									'quotes': threadQuotes,
									'crossquotes': crossQuotes,
									'message': message
								}
							}
						}
					});
				}
			}));
		}
	}

	//bulkwrite it all
	if (bulkWrites.length > 0) {
		await Posts.db.bulkWrite(bulkWrites);
	}

	if (threads.length > 0) {
		//delete the html/json for threads
		await Promise.all(threads.map(thread => {
			remove(`${uploadDirectory}/html/${thread.board}/thread/${thread.postId}.html`)
			remove(`${uploadDirectory}/json/${thread.board}/thread/${thread.postId}.json`)
		}));
	}

	//hooray!
	return { action: deletedPosts > 0, message:`Deleted ${threads.length > 0 ? (threads.length + ' thread' + (threads.length > 1 ? 's' : '')) : ''} ${threads.length > 0 && deletedPosts-threads.length > 0 ? 'and' : ''} ${deletedPosts-threads.length > 0 ? (deletedPosts-threads.length + ' post' + (deletedPosts-threads.length > 1 ? 's' : '')) : ''}` };

}
