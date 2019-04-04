'use strict';

const Mongo = require(__dirname+'/../helpers/db.js')
	, Boards = require(__dirname+'/boards.js')
	, db = Mongo.client.db('posts');

module.exports = {

	db,

	//TODO: IMPLEMENT PAGINATION
	getRecent: async (board, page) => {

		// get all thread posts (posts with null thread id)
		const threads = await db.collection(board).find({
			'thread': null
		},{
			'projection': {
				'salt': 0,
				'password': 0,
				'reports': 0
			}
		}).sort({
			'bumped': -1
		}).skip(10*(page-1)).limit(10).toArray();

		// add posts to all threads in parallel
		await Promise.all(threads.map(async thread => {
			const replies = await db.collection(board).find({
				'thread': thread._id
			},{
				'projection': {
					'salt': 0,
					'password': 0,
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
		return db.collection(board).estimatedDocumentCount();
	},

	getThread: async (board, id) => {

		// get thread post and potential replies concurrently
		const data = await Promise.all([
			db.collection(board).findOne({
				'_id': id
			}, {
				'projection': {
					'salt': 0,
					'password': 0,
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
		return db.collection(board).find({
			'thread': id
		}, {
			'projection': {
				'salt': 0 ,
				'password': 0,
				'reports': 0
			}
		}).sort({
			'_id': 1
		}).toArray();

	},

	getCatalog: (board) => {

		// get all threads for catalog
		return db.collection(board).find({
			'thread': null
		}, {
			'projection': {
				'salt': 0,
				'password': 0,
				'reports': 0
			}
		}).toArray();

	},

	getPost: (board, id, admin) => {

		// get a post
		if (admin) {
			return db.collection(board).findOne({
				'_id': id
			});
		}

		return db.collection(board).findOne({
			'_id': id
		}, {
			'projection': {
				'salt': 0,
				'password': 0,
				'reports': 0
			}
		});

	},

	//takes array "ids" of post ids
	getPosts: (board, ids, admin) => {

		if (admin) {
			return db.collection(board).find({
				'_id': {
					'$in': ids
				}
			}).toArray();
		}

		return db.collection(board).find({
			'_id': {
				'$in': ids
			}
		}, {
			'projection': {
				'salt': 0,
				'password': 0,
				'reports': 0
			}
		}).toArray();

	},

	insertOne: async (board, data) => {

		// bump thread if name not sage
		if (data.thread !== null && data.name !== 'sage') {
			await db.collection(board).updateOne({
				'_id': data.thread
			}, {
				'$set': {
					'bumped': Date.now()
				}
			})
		}

		data._id = await Boards.getNextId(board);

		//this is a thread, so set the bump date so its pushed to the top
		if (data.thread == null) {
			data.bumped = Date.now()
		}

		return db.collection(board).insertOne(data);

	},

	reportMany: (board, ids, report) =>  {
		return db.collection(board).updateMany({
			'_id': {
				'$in': ids
			}
		}, {
			'$push': {
				'reports': report
			}
		});
	},

	getReports: (board) => {
		return db.collection(board).find({
			'reports.0': {
				'$exists': true
			}
		}, {
			'projection': {
				'salt': 0,
				'password': 0,
			}
		}).toArray();
	},

	deleteOne: (board, options) => {
		return db.collection(board).deleteOne(options);
	},

	deleteMany: (board, ids) => {

		return db.collection(board).deleteMany({
			'_id': {
				'$in': ids
			}
		});

	},

	deleteAll:  (board) => {
		return db.collection(board).deleteMany({});
	},

}
