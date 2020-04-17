'use strict';

const uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, { remove } = require('fs-extra')
	, { Posts } = require(__dirname+'/../../db/')
	, linkQuotes = require(__dirname+'/../../helpers/posting/quotes.js')
	, { markdown } = require(__dirname+'/../../helpers/posting/markdown.js')
	, sanitize = require('sanitize-html')
	, sanitizeOptions = require(__dirname+'/../../helpers/posting/sanitizeoptions.js');

module.exports = async (req, res) => {

	const { threads, postIds, postMongoIds } = res.locals.posts.reduce((acc, p) => {
		acc.postIds.push(p.postId);
		acc.postMongoIds.push(p._id);
		if (p.thread === null) {
			acc.threads.push(p);
		}
		return acc;
	}, { threads: [], postIds: [], postMongoIds: [] });

//console.log(threads, postIds, postMongoIds)

	const backlinkRebuilds = new Set();
	const bulkWrites = [];

	if (threads.length > 0) {
		//threads moved, so their html/json doesnt need to exist anymore
		await Promise.all(threads.map(thread => {
			return Promise.all([
				remove(`${uploadDirectory}/html/${thread.board}/thread/${thread.postId}.html`),
				remove(`${uploadDirectory}/json/${thread.board}/thread/${thread.postId}.json`)
			]);
		}));
   	}

	//remove backlinks from selected posts that link to unselected posts
	bulkWrites.push({
		'updateMany': {
			'filter': {
				'_id': {
					'$in': postMongoIds
				}
			},
			'update': {
				'$pull': {
					'backlinks': {
						'postId': {
							'$nin': postIds
						}
					}
				}
			}
		}
	});

	for (let j = 0; j < res.locals.posts.length; j++) {
		const post = res.locals.posts[j];
//note: needs debugging
//		if (post.crossquotes.filter(c => c.thread === req.body.move_to_thread).length > 0) {
			//a crossquote is in the thread we move to, so need to remarkup and add backlinks to those posts
			backlinkRebuilds.add(post._id);
//		}
		//get backlinks for posts to remarkup
		for (let i = 0; i < post.backlinks.length; i++) {
			backlinkRebuilds.add(post.backlinks[i]._id);
		}
		//remove dead backlinks to this post
		if (post.quotes.length > 0) {
			backlinkRebuilds.add(post._id);
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


	//increase file/reply count in thread we are moving the posts to
	const { replyposts, replyfiles } = res.locals.posts.reduce((acc, p) => {
		acc.replyposts += 1;
		acc.replyfiles += p.files.length;
		return acc;
	}, { replyposts: 0, replyfiles: 0 });
	bulkWrites.push({
		'updateOne': {
			'filter': {
				'postId': req.body.move_to_thread,
                'board': req.params.board
			},
			'update': {
				'$inc': {
					'replyposts': replyposts,
					'replyfiles': replyfiles,
				}
			}
		}
	});

	const movedPosts = await Posts.move(postMongoIds, req.body.move_to_thread).then(result => result.modifiedCount);

	//get posts that quoted moved posts so we can remarkup them
	if (backlinkRebuilds.size > 0) {
		const remarkupPosts = await Posts.globalGetPosts([...backlinkRebuilds]);
		await Promise.all(remarkupPosts.map(async post => { //doing these all at once
			if (post.nomarkup && post.nomarkup.length > 0) {
				//redo the markup
				let message = markdown(post.nomarkup);
				let { quotedMessage, threadQuotes, crossQuotes } = await linkQuotes(post.board, message, post.thread); // req.body.move_to_thread);
//console.log(quotedMessage, threadQuotes, crossQuotes)
				message = sanitize(quotedMessage, sanitizeOptions.after);
				bulkWrites.push({
					'updateMany': {
						'filter': {
							'_id': {
								'$in': threadQuotes.map(q => q._id)
							}
						},
						'update': {
							'$push': {
								'backlinks': { _id: post._id, postId: post.postId }
							}
						}
					}
				});
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

//console.log(require('util').inspect(bulkWrites, {depth:null}))

/*
- post A quotes B, then A is moved to another thread: WORKS (removes backlink on B)
- moving post A back into thread with B and backlink gets readded: WORKS
- move post B out and backlink from A gets removed: WORKS
- moving post B post back into thread with A and backlinks re-added: FAIL (need to come up with solution, but this is an uncommon occurence)
*/

	//bulkwrite it all
	if (bulkWrites.length > 0) {
		await Posts.db.bulkWrite(bulkWrites);
	}

	const ret = {
		message: 'Moved posts',
		action: movedPosts > 0,
	};

	return ret;

}
