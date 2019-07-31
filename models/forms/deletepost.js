'use strict';

const uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, { remove } = require('fs-extra')
	, Mongo = require(__dirname+'/../../db/db.js')
	, Posts = require(__dirname+'/../../db/posts.js')
	, Files = require(__dirname+'/../../db/files.js')
	, linkQuotes = require(__dirname+'/../../helpers/posting/quotes.js')
	, simpleMarkdown = require(__dirname+'/../../helpers/posting/markdown.js')
	, sanitize = require('sanitize-html')
	, sanitizeOptions = {
		allowedTags: [ 'span', 'a', 'em', 'strong', 'small' ],
		allowedAttributes: {
			'a': [ 'href', 'class' ],
			'span': [ 'class' ]
		}
	}

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
//TODO: use and $or/$in query so this can be tackled in a single db query
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
		const fileNames = postFiles.map(x => x.filename);
        await Files.decrement(fileNames);
	}

	//use this to not do unnecessary actions for posts where the thread is being deleted
	const deleteThreadMap = {};
	for (let i = 0; i < threads.length; i++) {
		const thread = threads[i];
		//if exists, add to set, else make the set
		if (!deleteThreadMap[thread.board]) {
			 deleteThreadMap[thread.board] = new Set();
		}
		deleteThreadMap[thread.board].add(thread.postId);
	}

	const bulkWrites = [];
	const backlinkRebuilds = new Set();
	for (let j = 0; j < allPosts.length; j++) {
		const post = allPosts[j];
		backlinkRebuilds.delete(post._id); //make sure we dont try and remarkup this post since its getting deleted.
		if (post.thread != null && !deleteThreadMap[post.board] || !deleteThreadMap[post.board].has(post.thread)) {
			//get backlinks for posts to remarkup
			for (let i = 0; i < post.backlinks.length; i++) {
				const backlink = post.backlinks[i];
				if (!backlinkRebuilds.has(backlink._id)) {
					backlinkRebuilds.add(backlink._id);
				}
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

	//deleting before remarkup so quotes are accurate
	const deletedPosts = await Posts.deleteMany(postMongoIds).then(result => result.deletedCount);

	//get posts that quoted deleted posts so we can remarkup them
	if (backlinkRebuilds.size > 0) {
		const remarkupPosts = await Posts.globalGetPosts([...backlinkRebuilds]);
		await Promise.all(remarkupPosts.map(async post => { //doing these all at once
			if (post.nomarkup && post.nomarkup.length > 0) { //is this check even necessary? how would it have a quote with no message
				//redo the markup
				let message = simpleMarkdown(post.nomarkup);
				const { quotedMessage, threadQuotes } = await linkQuotes(post.board, post.nomarkup, post.thread);
				message = sanitize(quotedMessage, sanitizeOptions);
				bulkWrites.push({
					'updateOne': {
		                'filter': {
		                    '_id': post._id
		                },
		                'update': {
		                    '$set': {
		                        'quotes': threadQuotes,
								'message': message
		                    }
		                }
		            }
		        });
			}
		}));
	}

	//bulkwrite it all
	if (bulkWrites.length > 0) {
		await Posts.db.bulkWrite(bulkWrites);
	}

	//hooray!
	return { action: deletedPosts > 0, message:`Deleted ${threads.length} threads and ${deletedPosts-threads.length} posts` };

}
