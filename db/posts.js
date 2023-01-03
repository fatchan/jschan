'use strict';

const Mongo = require(__dirname+'/db.js')
	, { isIP } = require('net')
	, { DAY } = require(__dirname+'/../lib/converter/timeutils.js')
	, Boards = require(__dirname+'/boards.js')
	, Stats = require(__dirname+'/stats.js')
	, { Permissions } = require(__dirname+'/../lib/permission/permissions.js')
	, { randomBytes } = require('crypto')
	, randomBytesAsync = require('util').promisify(randomBytes)
	, db = Mongo.db.collection('posts')
	, config = require(__dirname+'/../lib/misc/config.js');

module.exports = {

	db,

	getThreadPage: async (board, thread) => {
		const threadsBefore = await db.aggregate([
			{
				'$match': {
					'thread': null,
					'board': board,
				}
			}, {
				'$project': {
					'sticky': 1,
					'bumped': 1,
					'postId': 1,
					'board': 1,
					'thread': 1
				}
			}, {
				'$sort': {
					'sticky': -1,
					'bumped': -1
				}
			}
		]).toArray();
		//is there a way to do this in the db with an aggregation stage, instead of in js?
		const threadIndex = threadsBefore.findIndex((e) => e.postId === thread);
		const threadPage = Math.max(1, Math.ceil((threadIndex+1)/10));
		return threadPage;
	},

	getBoardRecent: async (offset=0, limit=20, ip, board, permissions) => {
		const query = {};
		if (board) {
			query['board'] = board;
		}
		const projection = {
			'salt': 0,
			'password': 0,
		};
		if (!board) {
			projection['reports'] = 0;
		} else {
			projection['globalreports'] = 0;
		}
		if (ip != null) {
			if (isIP(ip)) {
				query['ip.raw'] = ip;
			} else {
				query['ip.cloak'] = ip;
			}
		}
		if (!permissions.get(Permissions.VIEW_RAW_IP)) {
			projection['ip.raw'] = 0;
			//MongoError, why cant i just projection['reports.ip.raw'] = 0;
			if (board) {
				projection['reports'] = { ip: { raw: 0 } };
			} else {
				projection['globalreports'] = { ip: { raw: 0 } };
			}
		}
		const posts = await db.find(query, {
			projection
		}).sort({
			'_id': -1
		}).skip(offset).limit(limit).toArray();
		return posts;
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
				};
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
			};
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
			const { stickyPreviewReplies, previewReplies } = config.get;
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
					const latestPreviewBacklink = thread.backlinks.find(bl => { return bl.postId >= firstPreviewId; });
					if (latestPreviewBacklink != null) {
						const latestPreviewIndex = thread.backlinks.map(bl => bl.postId).indexOf(latestPreviewBacklink.postId);
						thread.previewbacklinks = thread.backlinks.slice(latestPreviewIndex);
					}
				}
				//count omitted image and posts
				const numPreviewFiles = replies.reduce((acc, post) => { return acc + post.files.length; }, 0);
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
								0 //still need to improve this to ignore bump limitthreads
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
		]);
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

	getCatalog: (board, sortSticky=true, catalogLimit=0) => {

		const threadsQuery = {
			thread: null,
		};
		if (board) {
			if (Array.isArray(board)) {
				//array for overboard catalog
				threadsQuery['board'] = {
					'$in': board
				};
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
			};
		}
		// get all threads for catalog
		return db.find(threadsQuery, {
			'projection': {
				'salt': 0,
				'password': 0,
				'ip': 0,
				'reports': 0,
				'globalreports': 0,
			}
		})
			.limit(catalogLimit)
			.sort(threadsSort)
			.toArray();

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

	checkExistingMessage: async (board, thread = null, hash) => {
		const query = {
			'board': board,
			'messagehash': hash,
		};
		if (thread !== null) {
			query['$or'] = [
				{ 'thread': thread },
				{ 'postId': thread },
			];
		}
		const postWithExistingMessage = await db.findOne(query, {
			'projection': {
				'messagehash': 1,
			}
		});
		return postWithExistingMessage;
	},

	checkExistingFiles: async (board, thread = null, hashes) => {
		const query = {
			'board': board,
			'files.hash': {
				'$in': hashes
			}
		};
		if (thread !== null) {
			query['$or'] = [
				{ 'thread': thread },
				{ 'postId': thread },
			];
		}
		const postWithExistingFiles = await db.findOne(query, {
			'projection': {
				'files.hash': 1,
			}
		});
		return postWithExistingFiles;
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
		const { quoteLimit } = config.get;
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

	insertOne: async (board, data, thread, anonymizer) => {
		const sageEmail = data.email === 'sage';
		const bumpLocked = thread && thread.bumplocked === 1;
		const bumpLimited = thread && thread.replyposts >= board.settings.bumpLimit;
		const cyclic = thread && thread.cyclic === 1;
		const saged = sageEmail || bumpLocked || (bumpLimited && !cyclic);
		if (data.thread !== null) {
			const filter = {
				'postId': data.thread,
				'board': board._id
			};
			//update thread reply and reply file count
			const query = {
				'$inc': {
					'replyposts': 1,
					'replyfiles': data.files.length
				}
			};
			//if post email is not sage, and thread not bumplocked, set bump date
			if (!saged) {
				query['$set'] = {
					'bumped': new Date()
				};
			} else if (bumpLimited && !cyclic) {
				query['$set'] = {
					'bumplocked': 1
				};
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

		const statsIp = (config.get.statsCountAnonymizers === false && anonymizer === true) ? null : data.ip.cloak;
		await Stats.updateOne(board._id, statsIp, data.thread == null);

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

		return { postMongoId, postId };

	},

	getBoardReportCounts: (boards) => {
		return db.aggregate([
			{
				'$match': {
					'board': {
						'$in': boards
					},
					'reports.0': {
						'$exists': true
					},
				}
			}, {
				'$group': {
					'_id': '$board',
					'count': {
						'$sum': 1
					}
				}
			}
		]).toArray();
	},

	getGlobalReportsCount: () => {
		return db.countDocuments({
			'globalreports.0': {
				'$exists': true
			}
		});
	},

	getReports: async (board, permissions) => {
		const projection = {
			'salt': 0,
			'password': 0,
			'globalreports': 0,
		};
		if (!permissions.get(Permissions.VIEW_RAW_IP)) {
			projection['ip.raw'] = 0;
			projection['reports'] = { ip: { raw: 0 } };
		}
		const posts = await db.find({
			'reports.0': {
				'$exists': true
			},
			'board': board
		}, { projection }).toArray();
		return posts;
	},

	getGlobalReports: async (offset=0, limit, ip, permissions) => {
		const projection = {
			'salt': 0,
			'password': 0,
			'reports': 0,
		};
		if (!permissions.get(Permissions.VIEW_RAW_IP)) {
			projection['ip.raw'] = 0;
			projection['globalreports'] = { ip: { raw: 0 } };
		}
		const query = {
			'globalreports.0': {
				'$exists': true
			}
		};
		if (ip != null) {
			if (isIP(ip)) {
				query['$or'] = [
					{ 'ip.raw': ip },
					{ 'globalreports.ip.raw': ip }
				];
			} else {
				query['$or'] = [
					{ 'ip.cloak': ip },
					{ 'globalreports.ip.cloak': ip }
				];
			}
		}
		const posts = await db.find(query, { projection }).skip(offset).limit(limit).toArray();
		return posts;
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
					'$skip': Math.ceil(board.settings.threadLimit/config.get.early404Fraction)
				}, {
					//then any that have less than early404Replies replies get matched again
					'$match': {
						'sticky':0,
						'replyposts': {
							'$lt': config.get.early404Replies
						}
					}
				}
			]).toArray();
		}

		return oldThreads.concat(early404Threads);
	},

	getMinimalThreads: (boards) => {
		return db.aggregate([
			{
				'$match': {
					'thread': null,
					'board': {
						'$in': boards,
					}
				}
			}, {
				'$project': {
					'sticky': 1,
					'bumped': 1,
					'postId': 1,
					'board': 1,
					'thread': 1,
				}
			}, {
				'$sort': {
					'sticky': -1,
					'bumped': -1,
				}
			}, {
				'$group': {
					'_id': '$board',
					'posts': {
						'$push': '$$CURRENT',
					}
				}
			}, {
				'$group': {
					'_id': null,
					'posts': {
						'$push': {
							'k': '$_id',
							'v': '$posts',
						}
					}
				}
			}, {
				'$replaceRoot': {
					'newRoot': {
						'$arrayToObject': '$posts',
					}
				}
			}
		]).toArray().then(r => r[0]);
	},

	fixLatest: (boards) => {
		return db.aggregate([
			{
				'$match': {
					//going to match against thread bump date instead
					'thread': null,
					'board': {
						'$in': boards
					},
				}
			}, {
				'$group': {
					'_id': '$board',
					'lastPostTimestamp': {
						'$max':'$bumped'
					}
				}
			}, {
				'$merge': {
					'into': 'boards'
				}
			}
		]).toArray();
	},

	hotThreads: async () => {
		const { hotThreadsLimit, hotThreadsThreshold, hotThreadsMaxAge } = config.get;
		if (hotThreadsLimit === 0){ //0 limit = no limit in mongodb
			return [];
		}
		const listedBoards = await Boards.getLocalListed();
		const potentialHotThreads = await db.find({
			'board': {
				'$in': listedBoards
			},
			'thread': null,
			'date': { //created in last month
				'$gte': new Date(Date.now() - hotThreadsMaxAge)
			},
			'bumped': { //bumped in last 7 days
				'$gte': new Date(Date.now() - (DAY * 7))
			},
			'replyposts': {
				'$gte': hotThreadsThreshold,
			}
		}).toArray();
		if (potentialHotThreads.length === 0) {
			return [];
		}
		const hotThreadReplyOrs = potentialHotThreads
			.map(t => ({ board: t.board, thread: t.postId }));
		const hotThreadScores = await db.aggregate([
			{
				'$match': {
					'$and': [
						{
							'$or': hotThreadReplyOrs
						},
						{
							'date': {
								'$gte': new Date(Date.now() - (DAY * 7))
							}
						},
					],
				},
			}, {
				'$group': {
					'_id': {
						'board': '$board',
						'thread': '$thread',
					},
					'score': {
						'$sum': 1,
					},
				},
			},
		]).toArray();
		//Welcome to improve into a pipeline if possible, but reducing to these maps isnt thaaat bad
		const hotThreadBiasMap = potentialHotThreads
			.reduce((acc, t) => {
				//(1 - (thread age / age limit)) = bias multiplier
				const threadAge = Date.now() - t.u;
				acc[`${t.board}-${t.postId}`] = Math.max(0, 1 - (threadAge / hotThreadsMaxAge)); //(0,1)
				return acc;
			}, {});
		const hotThreadScoreMap = hotThreadScores.reduce((acc, ht) => {
			acc[`${ht._id.board}-${ht._id.thread}`] = ht.score * hotThreadBiasMap[`${ht._id.board}-${ht._id.thread}`];
			return acc;
		}, {});
		const hotThreadsWithScore = potentialHotThreads.map(ht => {
			ht.score = hotThreadScoreMap[`${ht.board}-${ht.postId}`];
			return ht;
		}).sort((a, b) => {
			return b.score - a.score;
		}).slice(0, hotThreadsLimit);
		return hotThreadsWithScore;
	},

	deleteMany: (ids) => {
		return db.deleteMany({
			'_id': {
				'$in': ids
			}
		});
	},

	deleteAll: () => {
		return db.deleteMany();
	},

	move: async (postMongoIds, crossBoard, destinationThreadId, destinationBoard) => {
		let bulkWrites = []
			, newDestinationThreadId = destinationThreadId;
		if (crossBoard) {
			//postIds need to be adjusted if moving to a different board
			const lastId = await Boards.getNextId(destinationBoard, false, postMongoIds.length);
			//if moving board and no destination thread, pick the starting ID of the amount we incremented
			if (!destinationThreadId) {
				newDestinationThreadId = lastId;
			}
			bulkWrites = postMongoIds.map((postMongoId, index) => ({
				'updateOne': {
					'filter': {
						'_id': postMongoId,
					},
					'update': {
						'$set': {
							'postId': lastId + index,
						}
					}
				}
			}));
		}
		bulkWrites.push({
			'updateMany': {
				'filter': {
					'_id': {
						'$in': postMongoIds,
					}
				},
				'update': {
					'$set': {
						'board': destinationBoard,
						'thread': newDestinationThreadId,
					},
					'$unset': {
						'replyposts': '',
						'replyfiles': '',
						'sticky': '',
						'locked': '',
						'bumplocked': '',
						'cyclic': '',
					}
				}
			}
		});
		if (!destinationThreadId) {
			//No destination thread i.e we are maing a new thread from the selected posts, make one the OP
			bulkWrites.push({
				'updateOne': {
					'filter': {
						'_id': postMongoIds[0],
					},
					'update': {
						'$set': {
							'thread': null,
							'replyposts': 0,
							'replyfiles': 0,
							'sticky': 0,
							'locked': 0,
							'bumplocked': 0,
							'cyclic': 0,
							'salt': (await randomBytesAsync(128)).toString('base64'),
						}
					}
				}
			});
		}
		// console.log(JSON.stringify(bulkWrites, null, 4));
		const movedPosts = await db.bulkWrite(bulkWrites).then(result => result.modifiedCount);
		return { movedPosts, destinationThreadId: newDestinationThreadId };
	},

	threadExistsMiddleware: async (req, res, next) => {
		const thread = await module.exports.getPost(req.params.board, req.params.id);
		if (!thread) {
			return res.status(404).render('404');
		}
		res.locals.thread = thread;
		next();
	},

	postExists: (board, postId) => {
		return db.findOne({
			'board': board,
			'postId': postId,
		}, {
			'projection': {
				'salt': 0 ,
				'password': 0,
				'ip': 0,
				'reports': 0,
				'globalreports': 0,
			}
		});
	},

	postExistsMiddleware: async (req, res, next) => {
		const post = await module.exports.postExists(req.params.board, req.params.id);
		if (!post) {
			return res.status(404).render('404');
		}
		res.locals.post = post;
		next();
	},

};
