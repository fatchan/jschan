'use strict';

const Mongo = require(__dirname+'/../helpers/db.js')
	, db = Mongo.client.db('boards');

module.exports = {

	db,

	findOne: async (name) => {
		return db.collection('boards').findOne({ '_id': name });
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

}
