'use strict';

const Mongo = require(__dirname+'/../helpers/db.js')

module.exports = new class Posts {

	constructor() {
		this._db = Mongo.client.db('chan-boards');
	}

	//TODO: IMPLEMENT PAGINATION
	async getRecent(board, page) {

		// get all thread posts (posts with null thread id)
		const threads = await this._db.collection(board).find({
			'thread': null
		}).sort({
			'bumped': -1
		}).limit(10).toArray();

		// add posts to all threads in parallel
		await Promise.all(threads.map(async thread => {
			thread.replies = await this._db.collection(board).find({
				'thread': thread._id
			}).sort({
				'_id': 1
			}).limit(3).toArray();
		}));

		return threads;

	}

	async getThread(board, id) {

		// get thread post and potential replies concurrently
		const data = await Promise.all([
			this._db.collection(board).findOne({
				'_id': Mongo.ObjectId(id)
			}),
			this._db.collection(board).find({
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

	}

	async getCatalog(board) {

		// get all threads for catalog
		return this._db.collection(board).find({
			'thread': null
		}).toArray();

	}

	async getPost(board, id) {

		// get a post
		return this._db.collection(board).findOne({
			'_id': Mongo.ObjectId(id)
		});

	}

	async insertOne(board, data) {

		// bump thread if name not sage
		if (data.thread !== null && data.author !== 'sage') {
			await this._db.collection(board).updateOne({
				'_id': data.thread
			}, {
				$set: {
					'bumped': Date.now()
				}
			})
		}

		return this._db.collection(board).insertOne(data);

	}

	async deleteOne(board, options) {
		return this._db.collection(board).deleteOne(options);
	}

	async deleteMany(board, options) {
		return this._db.collection(board).deleteMany(options);
	}

	async deleteAll(board) {
		return this._db.collection(board).deleteMany({});
	}

	async checkBoard(name) {
		return this._db.listCollections({ 'name': name }, { 'nameOnly': true }).toArray();
	}

}()
