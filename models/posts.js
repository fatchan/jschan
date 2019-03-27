'use strict';

const Mongo = require(__dirname+'/../helpers/db.js')
	, db = Mongo.client.db('chan-boards');

module.exports = {

	//TODO: IMPLEMENT PAGINATION
	getRecent: async (board, page) => {

		// get all thread posts (posts with null thread id)
		const threads = await db.collection(board).find({
			'thread': null
		}).sort({
			'bumped': -1
		}).limit(10).toArray();

		// add posts to all threads in parallel
		await Promise.all(threads.map(async thread => {
			const replies = await db.collection(board).find({
				'thread': thread._id
			}).sort({
				'_id': -1
			}).limit(3).toArray();
			thread.replies = replies.reverse();
		}));

		return threads;

	},

	getThread: async (board, id) => {

		// get thread post and potential replies concurrently
		const data = await Promise.all([
			db.collection(board).findOne({
				'_id': Mongo.ObjectId(id)
			}),
			db.collection(board).find({
				'thread': Mongo.ObjectId(id)
			}).sort({
				'_id': 1
			}).toArray()
		])

		// attach the replies to the thread post
		const thread = data[0];
		if (thread) {
			thread.replies = data[1];
		}

		return thread;

	},

	getCatalog: async (board) => {

		// get all threads for catalog
		return db.collection(board).find({
			'thread': null
		}).toArray();

	},

	getPost: async (board, id) => {

		// get a post
		return db.collection(board).findOne({
			'_id': Mongo.ObjectId(id)
		});

	},

	insertOne: async (board, data) => {

		// bump thread if name not sage
		if (data.thread !== null && data.author !== 'sage') {
			await db.collection(board).updateOne({
				'_id': data.thread
			}, {
				$set: {
					'bumped': Date.now()
				}
			})
		}

		return db.collection(board).insertOne(data);

	},

	deleteOne: async (board, options) => {
		return db.collection(board).deleteOne(options);
	},

	deleteMany: async (board, options) => {
		return db.collection(board).deleteMany(options);
	},

	deleteAll: async (board) => {
		return db.collection(board).deleteMany({});
	},

	checkBoard: async (req, res, next) => {

		const boards = await db.listCollections({ 'name': req.params.board }, { 'nameOnly': true }).toArray();
		if (!boards || boards.length == 0) {
			return res.status(404).render('404')
		}
		next();

	},

}
