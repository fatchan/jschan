'use strict';

const Mongo = require(__dirname+'/../helpers/db.js')
	, db = Mongo.client.db('boards');

module.exports = {

	db,

	findOne: async (name) => {
		return db.collection('boards').findOne({ '_id': name });
	},

	find: async (name) => {
		return db.collection('boards').find({}).toArray();
	},

	insertOne: async (data) => {
		return db.collection('boards').insertOne(data);
	},

	deleteOne: async (board, options) => {

	},

	deleteMany: async (board, options) => {

	},

	deleteAll: async (board) => {
		return db.collection('boards').deleteMany({});
	},

	exists: async (req, res, next) => {

		const board = await module.exports.findOne(req.params.board)
		if (!board) {
			return res.status(404).render('404')
		}
		res.locals.board = board;
		next();

	},

	getNextId: async (board) => {

		const increment = await db.collection('counters').findOneAndUpdate(
			{
				'_id': board
			},
			{
				'$inc': {
					'sequence_value': 1
				}
			},
			{
				'upsert': true
			}
		);

		// faster than toString()
		return increment.value.sequence_value + '';

	},

	deleteIncrement: async (board) => {

		await db.collection('counters').findOneAndUpdate(
			{
				'_id': board
			},
			{
				'$set': {
					'sequence_value': 1
				}
			},
			{
				'upsert': true
			}
		);

		return;

	},

}
