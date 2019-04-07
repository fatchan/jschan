'use strict';

const Mongo = require(__dirname+'/../helpers/db.js')
	, Boards = require(__dirname+'/boards.js')
	, db = Mongo.client.db('jschan').collection('posts');

module.exports = {

	db,

	//TODO: IMPLEMENT PAGINATION
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
				'reports': 0
			}
		}).sort({
			'bumped': -1
		}).skip(10*(page-1)).limit(10).toArray();

		// add last 3 posts in reverse order to preview
		await Promise.all(threads.map(async thread => {
			const replies = await db.find({
				'thread': thread.postId,
				'board': board
			},{
				'projection': {
					'salt': 0,
					'password': 0,
					'ip': 0,
					'reports': 0
				}
			}).sort({
				'_id': -1
			}).limit(3).toArray();
			thread.replies = replies.reverse();
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
				'board': board
			}, {
				'projection': {
					'salt': 0,
					'password': 0,
					'ip': 0,
					'reports': 0
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
				'reports': 0
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
				'reports': 0
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
				'reports': 0
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
				'reports': 0
			}
		}).toArray();

	},

	insertOne: async (board, data) => {

		// bump thread if name not sage
		if (data.thread !== null && data.email !== 'sage') {
			await db.updateOne({
				'postId': data.thread,
				'board': board
			}, {
				'$set': {
					'bumped': Date.now()
				}
			})
		}

		const postId = await Boards.getNextId(board);
		data.postId = postId;

		//this is a thread, so set the bump date so its pushed to the top
		if (data.thread == null) {
			data.bumped = Date.now()
		}

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
			}
		}).toArray();
	},

	deleteOne: (board, options) => {
		return db.deleteOne(options);
	},

	deleteMany: (board, ids) => {

		return db.deleteMany({
			'postId': {
				'$in': ids
			},
			'board': board
		});

	},

	deleteAll: (board) => {
		return db.deleteMany({
			'board': board
		});
	},

}
