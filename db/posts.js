'use strict';

const Mongo = require(__dirname+'/db.js')
	, Boards = require(__dirname+'/boards.js')
	, db = Mongo.client.db('jschan').collection('posts');

module.exports = {

	db,

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
			'bumped': -1
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
				'_id': -1
			}).limit(5).toArray();

			//reverse order for board page
			thread.replies = replies.reverse();

			//count omitted image and posts
			const numPreviewImages = replies.reduce((acc, post) => {
				return acc + post.files.length;
			}, 0);
			thread.omittedimages = thread.replyimages - numPreviewImages;
			thread.omittedposts = thread.replyposts - replies.length;

		}));
		return threads;

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

	//takes array "ids" of mongo ids to get posts from any board
	globalGetPosts: (ids) => {
		return db.find({
			'_id': {
				'$in': ids
			},
		}).toArray();
	},

	insertOne: async (board, data) => {

		if (data.thread !== null) {
			//if not a thread, update reply and image count on op document;
			const filter = {
				'postId': data.thread,
				'board': board
			}
			const query = {
				'$inc': {
					'replyposts': 1,
					'replyimages': data.files.length
				}
			}
			// bump thread if name not sage
			if (data.email !== 'sage') {
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

	reportMany: (board, ids, report) =>  {
		return db.updateMany({
			'postId': {
				'$in': ids
			},
			'board': board
		}, {
			'$push': {
				'reports': report
			}
		});
	},

	globalReportMany: (ids, report) =>  {
		return db.updateMany({
			'_id': {
				'$in': ids
			},
		}, {
			'$push': {
				'globalreports': report
			}
		});
	},

	getReports: (board) => {
		return db.find({
			'reports.0': {
				'$exists': true
			},
			'board': board
		}).toArray();
	},

	dismissReports: (board, ids) => {
		return db.updateMany({
			'postId': {
				'$in': ids
			},
			'board': board
		}, {
			'$set': {
				'reports': []
			}
		});
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
				'globalreports': 0,
			}
		}).toArray();
	},

	dismissGlobalReports: (ids) => {
		return db.updateMany({
			'_id': {
				'$in': ids
			},
		}, {
			'$set': {
				'globalreports': []
			}
		});
	},

	deleteOne: (board, options) => {
		return db.deleteOne(options);
	},

	deleteFilesMany: (ids) => {
		return db.updateMany({
			'_id': {
				'$in': ids
			}
		}, {
			'$set': {
				'files': []
			}
		});
	},

	deleteMany: (ids) => {

		return db.deleteMany({
			'_id': {
				'$in': ids
			}
		});

	},

	spoilerMany: (ids) => {

		return db.updateMany({
			'_id': {
				'$in': ids
			}
		}, {
			'$set': {
				'spoiler': true
			}
		});

	},

	deleteAll: (board) => {
		return db.deleteMany({
			'board': board
		});
	},

}
