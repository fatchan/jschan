'use strict';

const Mongo = require(__dirname+'/db.js')
	, Boards = require(__dirname+'/boards.js')
	, deletePostFiles = require(__dirname+'/../helpers/files/deletepostfiles.js')
	, db = Mongo.client.db('jschan').collection('posts');

module.exports = {

	db,

	getBeforeCount: (board, thread) => {
		return db.countDocuments({
			'board': board,
			'thread': null,
			'bumped': {
				'$gte': thread.bumped
			}
		});
	},

	getAfterCount: (board, thread) => {
		return db.countDocuments({
			'board': board,
			'thread': null,
			'bumped': {
				'$lte': thread.bumped
			}
		});
	},

	getRecent: async (board, page) => {
		// get all thread posts (posts with null thread id)
		const threads = await db.find({
			'thread': null,
			'board': board
		},{
			'projection': {
				'salt': 0,
				'password': 0,
				'ip': 0,
				'reports': 0,
				'globalreports': 0,
			}
		}).sort({
			'sticky': -1,
			'bumped': -1,
		}).skip(10*(page-1)).limit(10).toArray();

		// add last 5 posts in reverse order to preview
		await Promise.all(threads.map(async thread => {
			const replies = await db.find({
				'thread': thread.postId,
				'board': board
			},{
				'projection': {
					'salt': 0,
					'password': 0,
					'ip': 0,
					'reports': 0,
					'globalreports': 0,
				}
			}).sort({
				'postId': -1
			}).limit(5).toArray();

			//reverse order for board page
			thread.replies = replies.reverse();

			//temporary mitigation for deletion issue
			if (replies.length > 5) {
				//cout omitted image and posts
				const numPreviewImages = replies.reduce((acc, post) => { return acc + post.files.length }, 0);
				thread.omittedimages = thread.replyfiles - numPreviewImages;
				thread.omittedposts = thread.replyposts - replies.length;
			}
		}));
		return threads;

	},

	getReplyCounts: (board, thread) => {
		return db.aggregate([
			{
				'$match': {
					'thread': thread,
					'board': board,
				}
			}, {
				'$group': {
					'_id': null,
					'replyposts': {
						'$sum': 1
					},
					'replyfiles': {
						'$sum': {
							'$size': '$files'
						}
					}
				}
			}
		]).toArray();
	},

	setReplyCounts: (board, thread, replyposts, replyfiles) => {
		return db.updateOne({
			'postId': thread,
			'board': board
		}, {
			'$set': {
				'replyposts': replyposts,
				'replyfiles': replyfiles,
			}
		})
	},

	getPages: (board) => {
		return db.countDocuments({
			'board': board,
			'thread': null
		});
	},

	getThread: async (board, id) => {
		// get thread post and potential replies concurrently
		const data = await Promise.all([
			db.findOne({
				'postId': id,
				'board': board,
				'thread': null,
			}, {
				'projection': {
					'salt': 0,
					'password': 0,
					'ip': 0,
					'reports': 0,
					'globalreports': 0,
				}
			}),
			module.exports.getThreadPosts(board, id)
		])
		// attach the replies to the thread post
		const thread = data[0];
		if (thread) {
			thread.replies = data[1];
		}
		return thread;

	},

	getThreadPosts: (board, id) => {
		// all posts within a thread
		return db.find({
			'thread': id,
			'board': board
		}, {
			'projection': {
				'salt': 0 ,
				'password': 0,
				'ip': 0,
				'reports': 0,
				'globalreports': 0,
			}
		}).sort({
			'_id': 1
		}).toArray();
	},

	getMultipleThreadPosts: (board, ids) => {
		//all posts from multiple threads in a single board
		return db.find({
			'board': board,
			'thread': {
				'$in': ids
			}
		}, {
			'projection': {
				'salt': 0 ,
				'password': 0,
				'ip': 0,
				'reports': 0,
				'globalreports': 0,
			}
		}).toArray();
	},

	getCatalog: (board) => {

		// get all threads for catalog
		return db.find({
			'thread': null,
			'board': board
		}, {
			'projection': {
				'salt': 0,
				'password': 0,
				'ip': 0,
				'reports': 0,
				'globalreports': 0,
			}
		}).sort({
			'sticky': -1,
			'bumped': -1,
		}).toArray();

	},

	getPost: (board, id, admin) => {

		// get a post
		if (admin) {
			return db.findOne({
				'postId': id,
				'board': board
			});
		}

		return db.findOne({
			'postId': id,
			'board': board
		}, {
			'projection': {
				'salt': 0,
				'password': 0,
				'ip': 0,
				'reports': 0,
				'globalreports': 0,
			}
		});

	},

	//takes array "ids" of post ids
	getPosts: (board, ids, admin) => {

		if (admin) {
			return db.find({
				'postId': {
					'$in': ids
				},
				'board': board
			}).toArray();
		}

		return db.find({
			'postId': {
				'$in': ids
			},
			'board': board
		}, {
			'projection': {
				'salt': 0,
				'password': 0,
				'ip': 0,
				'reports': 0,
				'globalreports': 0,
			}
		}).toArray();

	},

	// get only thread and post id for use in quotes
	getPostsForQuotes: (queryOrs) => {
		return db.find({
			'$or': queryOrs
		}, {
			'projection': {
				'postId': 1,
				'board': 1,
				'thread': 1,
			}
		}).limit(15).toArray(); //limit 15 quotes for now.
	},

	//takes array "ids" of mongo ids to get posts from any board
	globalGetPosts: (ids) => {
		return db.find({
			'_id': {
				'$in': ids
			},
		}).toArray();
	},

	insertOne: async (board, data, thread) => {
		if (data.thread !== null && data.email !== 'sage' && !thread.saged) {
			const filter = {
				'postId': data.thread,
				'board': board
			}
			const query = {
				'$inc': {
					'replyposts': 1,
					'replyfiles': data.files.length
				}
			}
			if (data.email !== 'sage' && !thread.saged) {
				query['$set'] = {
					'bumped': Date.now()
				}
			}
			await db.updateOne(filter, query);
		} else {
			//this is a new thread, so set the bump date
			data.bumped = Date.now()
		}

		const postId = await Boards.getNextId(board);
		data.postId = postId;
		await db.insertOne(data);
		return postId;

	},

	getReports: (board) => {
		return db.find({
			'reports.0': {
				'$exists': true
			},
			'board': board
		}, {
			'projection': {
				'salt': 0,
				'password': 0,
				'ip': 0,
				'globalreports': 0,
			}
		}).toArray();
	},

	getGlobalReports: () => {
		return db.find({
			'globalreports.0': {
				'$exists': true
			}
		}, {
			'projection': {
				'salt': 0,
				'password': 0,
				'ip': 0,
				'reports': 0,
			}
		}).toArray();
	},

	deleteOne: (board, options) => {
		return db.deleteOne(options);
	},

	pruneOldThreads: async (board, threadLimit) => {
		//get lowest bumped threads
		const threads = await db.find({
			'thread': null,
			'board': board
		}).sort({
			'sticky': -1,
			'bumped': -1
		}).skip(threadLimit).toArray();
		//if there are any
		if (threads.length === 0) {
			return [];
		}
		//get the postIds
		const threadIds = threads.map(thread => thread.postId);
		//get all the posts from those threads
		const threadPosts = await module.exports.getMultipleThreadPosts(board, threadIds);
		//combine them
		const postsAndThreads = threads.concat(threadPosts);
		//get the filenames and delete all the files
		let fileNames = [];
		postsAndThreads.forEach(post => {
			fileNames = fileNames.concat(post.files.map(x => x.filename))
		});
		if (fileNames.length > 0) {
			await deletePostFiles(fileNames);
		}
		//get the mongoIds and delete them all
		const postMongoIds = postsAndThreads.map(post => Mongo.ObjectId(post._id));
		await module.exports.deleteMany(postMongoIds);
		return threadIds;
	},

	deleteMany: (ids) => {
		return db.deleteMany({
			'_id': {
				'$in': ids
			}
		});
	},

	deleteAll: (board) => {
		return db.deleteMany({
			'board': board
		});
	},

}
