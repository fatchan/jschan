'use strict';

const Mongo = require(__dirname+'/db.js')
	, Boards = require(__dirname+'/boards.js')
	, Stats = require(__dirname+'/stats.js')
	, db = Mongo.client.db('jschan').collection('posts')
	, { quoteLimit, previewReplies, stickyPreviewReplies
		, early404Replies, early404Fraction } = require(__dirname+'/../configs/main.js');

module.exports = {

	db,

	getThreadPage: async (board, thread) => {
		const threadsBefore = await db.countDocuments({
			'board': board,
			'thread': null,
			'bumped': {
				'$gte': thread.bumped
			}
		});
		return Math.ceil(threadsBefore/10) || 1; //1 because 0 threads before is page 1
	},

	getGlobalRecent: (offset=0, limit=20, ip) => {
		//global recent posts for recent section of global manage page
		const query = {};
		if (ip instanceof RegExp) {
			query['ip.single'] = ip;
		} else if (typeof ip === 'string') {
			query['ip.raw'] = ip;
		}
		return db.find(query).sort({
			'_id': -1
		}).skip(offset).limit(limit).toArray();
	},

	getBoardRecent: (offset=0, limit=20, ip, board) => {
		const query = {
			board
		};
		if (ip instanceof RegExp) {
			query['ip.single'] = ip;
		} else if (typeof ip === 'string') {
			query['ip.raw'] = ip;
		}
		return db.find(query).sort({
			'_id': -1
		}).skip(offset).limit(limit).toArray();
	},

	getRecent: async (board, page, limit=10, getSensitive=false, sortSticky=true) => {
		// get all thread posts (posts with null thread id)
		const projection = {
			'salt': 0,
			'password': 0,
			'reports': 0,
			'globalreports': 0,
		};
		if (!getSensitive) {
			projection['ip'] = 0;
		}
		const threadsQuery = {
			'thread': null,
		};
		if (board) {
			if (Array.isArray(board)) {
				//array for overboard
				threadsQuery['board'] = {
					'$in': board
				}
			} else {
				threadsQuery['board'] = board;
			}
		}
		let threadsSort = {
			'bumped': -1,
		};
		if (sortSticky === true) {
			threadsSort = {
				'sticky': -1,
				'bumped': -1
			}
		}
		const threads = await db.find(threadsQuery, {
			projection
		})
		.sort(threadsSort)
		.skip(10*(page-1))
		.limit(limit)
		.toArray();

		// add last n posts in reverse order to preview
		await Promise.all(threads.map(async thread => {
			const previewRepliesLimit = thread.sticky ? stickyPreviewReplies : previewReplies;
			const replies = previewRepliesLimit === 0 ? [] : await db.find({
				'thread': thread.postId,
				'board': thread.board
			},{
				projection
			}).sort({
				'postId': -1
			}).limit(previewRepliesLimit).toArray();

			//reverse order for board page
			thread.replies = replies.reverse();

			//if enough replies, show omitted count
			if (thread.replyposts > previewRepliesLimit) {
				//dont show all backlinks on OP for previews on index page
				thread.previewbacklinks = [];
				if (previewRepliesLimit > 0) {
					const firstPreviewId = thread.replies[0].postId;
					const latestPreviewBacklink = thread.backlinks.find(bl => { return bl.postId >= firstPreviewId });
					if (latestPreviewBacklink != null) {
						const latestPreviewIndex = thread.backlinks.map(bl => bl.postId).indexOf(latestPreviewBacklink.postId);
						thread.previewbacklinks = thread.backlinks.slice(latestPreviewIndex);
					}
				}
				//count omitted image and posts
				const numPreviewFiles = replies.reduce((acc, post) => { return acc + post.files.length }, 0);
				thread.omittedfiles = thread.replyfiles - numPreviewFiles;
				thread.omittedposts = thread.replyposts - replies.length;
			}
		}));
		return threads;

	},

	resetThreadAggregates: (ors) => {
		return db.aggregate([
			{
				'$match': {
					'$or': ors
				}
			}, {
				'$set': {
					'replyposts': 0,
					'replyfiles': 0,
					'bumped': '$date'
				}
			}, {
				'$project': {
					'_id': 1,
					'board': 1,
					'replyposts': 1,
					'replyfiles': 1,
					'bumped': 1
				}
			}
		]).toArray();
	},

	getThreadAggregates: (ors) => {
		return db.aggregate([
			{
				'$match': {
					'$or': ors
				}
			}, {
				'$group': {
					'_id': {
						'thread': '$thread',
						'board': '$board'
					},
					'replyposts': {
						'$sum': 1
					},
					'replyfiles': {
						'$sum': {
							'$size': '$files'
						}
					},
					'bumped': {
						'$max': {
							'$cond': [
								{ '$ne': [ '$email', 'sage' ] },
								'$date',
								0 //still need to improve this to ignore bumplocked or bumplimited threads
							]
						}
					}
				}
			}
		]).toArray();
	},

	getPages: (board) => {
		return db.countDocuments({
			'board': board,
			'thread': null
		});
	},

	getThread: async (board, id, getSensitive=false) => {
		// get thread post and potential replies concurrently
		const projection = {
			'salt': 0,
			'password': 0,
			'reports': 0,
			'globalreports': 0,
		};
		if (!getSensitive) {
			projection['ip'] = 0;
		}
		const [thread, replies] = await Promise.all([
			db.findOne({
				'postId': id,
				'board': board,
				'thread': null,
			}, {
				projection,
			}),
			module.exports.getThreadPosts(board, id, projection)
		])
		// attach the replies to the thread post
		if (thread && replies) {
			thread.replies = replies;
		}
		return thread;
	},

	getThreadPosts: (board, id, projection) => {
		// all posts within a thread
		return db.find({
			'thread': id,
			'board': board
		}, {
			projection
		}).sort({
			'postId': 1
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

	getPost: (board, id, getSensitive=false) => {

		// get a post
		if (getSensitive) {
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

	allBoardPosts: (board) => {
		return db.find({
			'board': board
		}).toArray();
	},

	//takes array "ids" of post ids
	getPosts: (board, ids, getSensitive=false) => {

		if (getSensitive) {
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
		}).limit(quoteLimit).toArray();
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
		let saged = data.email === 'sage' //if email is sage
			|| (thread &&
				(thread.bumplocked //or thread bumplocked
				|| thread.replyposts >= board.settings.bumpLimit //or at bump limit
			));
		if (data.thread !== null) {
			const filter = {
				'postId': data.thread,
				'board': board._id
			}
			//update thread reply and reply file count
			const query = {
				'$inc': {
					'replyposts': 1,
					'replyfiles': data.files.length
				}
			}
			//if post email is not sage, and thread not bumplocked, set bump date
			if (!saged) {
				query['$set'] = {
					'bumped': new Date()
				}
			}
			//update the thread
			await db.updateOne(filter, query);
		} else {
			//this is a new thread so just set the bump date
			data.bumped = new Date();
		}

		//get the postId and add it to the post
		const postId = await Boards.getNextId(board._id, saged);
		data.postId = postId;

		//insert the post itself
		const postMongoId = await db.insertOne(data).then(result => result.insertedId); //_id of post

		await Stats.updateOne(board._id, data.ip.single, data.thread == null);

		//add backlinks to the posts this post quotes
		if (data.thread && data.quotes.length > 0) {
			await db.updateMany({
				'_id': {
					'$in': data.quotes.map(q => q._id)
				}
			}, {
				'$push': {
					'backlinks': { _id: postMongoId, postId: postId }
				}
			});
		}

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
				//'ip': 0,
				'globalreports': 0,
			}
		}).toArray();
	},

	getGlobalReports: (offset=0, limit, ip) => {
		const query = {
			'globalreports.0': {
				'$exists': true
			}
		}
		if (ip instanceof RegExp) {
			query['$or'] = [
				{ 'ip.single': ip },
				{ 'globalreports.ip.single': ip }
			];
		} else if (typeof ip === 'string') {
			query['$or'] = [
				{ 'ip.raw': ip },
				{ 'globalreports.ip.raw': ip }
			];
		}
		return db.find(query, {
			'projection': {
				'salt': 0,
				'password': 0,
				'reports': 0,
			}
		}).skip(offset).limit(limit).toArray();
	},

	deleteOne: (board, options) => {
		return db.deleteOne(options);
	},

	pruneThreads: async (board) => {

		//get threads that have been bumped off last page
		const oldThreads = await db.find({
			'thread': null,
			'board': board._id
		}).sort({
			'sticky': -1,
			'bumped': -1
		}).skip(board.settings.threadLimit).toArray();

		let early404Threads = [];
		if (board.settings.early404 === true) {
			early404Threads = await db.aggregate([
				{
					//get all the threads for a board
					'$match': {
						'thread': null,
						'board': board._id
					}
				}, {
					//in bump date order
					'$sort': {
						'sticky': -1,
						'bumped': -1
					}
				}, {
					//skip the first (board.settings.threadLimit/early404Fraction)
					'$skip': Math.ceil(board.settings.threadLimit/early404Fraction)
				}, {
					//then any that have less than early404Replies replies get matched again
					'$match': {
						'sticky':0,
						'replyposts': {
							'$lt': early404Replies
						}
					}
				}
			]).toArray();
		}

		return oldThreads.concat(early404Threads);
	},

	fixLatest: (boards) => {
		return db.aggregate([
			{
				'$match': {
					'board': {
						'$in': boards
					},
					'email': {
						'$ne': 'sage'
					}
				}
			}, {
				'$group': {
					'_id': '$board',
					'lastPostTimestamp': {
						'$max':'$date'
					}
				}
			}, {
				'$merge': {
					'into': 'boards'
				}
			}
		]).toArray();
	},

	deleteMany: (ids) => {
		return db.deleteMany({
			'_id': {
				'$in': ids
			}
		});
	},

	deleteAll: (board) => {
		return db.deleteMany();
	},

	move: (ids, dest) => {
		return db.updateMany({
			'_id': {
				'$in': ids
			}
		}, {
			'$set': {
				'thread': dest
			},
			'$unset': {
				'replyposts': '',
				'replyfiles': '',
				'sticky': '',
				'locked': '',
				'bumplocked': '',
				'cyclic': '',
				'salt': ''
			}
		});
	},

	threadExists: (board, thread) => {
		return db.findOne({
			'postId': thread,
			'board': board,
			'thread': null,
		}, {
			'projection': {
				'_id': 1,
				'postId': 1
			}
		});
	},

	exists: async (req, res, next) => {
		const thread = await module.exports.threadExists(req.params.board, req.params.id);
		if (!thread) {
			return res.status(404).render('404');
		}
		res.locals.thread = thread; // can acces this in views or next route handlers
		next();
	}

}
