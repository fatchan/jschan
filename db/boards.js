'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan');

module.exports = {

	db: db.collection('boards'),

	findOne: (name) => {
		return db.collection('boards').findOne({ '_id': name });
	},

	find: () => {
		return db.collection('boards').find({}).toArray();
	},

	insertOne: (data) => {
		return db.collection('boards').insertOne(data);
	},

	deleteAll: (board) => {
		return db.collection('boards').deleteMany({});
	},

	removeBanners: (board, filenames) => {
		return db.collection('boards').updateOne(
			{
				'_id': board,
			}, {
				'$pullAll': {
					'banners': filenames
				}
			}
		);
	},

	addBanners: (board, filenames) => {
		return db.collection('boards').updateOne(
			{
				'_id': board,
			}, {
				'$push': {
					'banners': {
						'$each': filenames
					}
				}
			}
		);
	},

	exists: async (req, res, next) => {

		const board = await module.exports.findOne(req.params.board);
		if (!board) {
			return res.status(404).render('404');
		}
		res.locals.board = board; // can acces this in views or next route handlers
		next();

	},

	getNextId: async (board) => {

		const increment = await db.collection('boards').findOneAndUpdate(
			{
				'_id': board
			},
			{
				'$inc': {
					'sequence_value': 1
				}
			},
			{
				'projection': {
					'sequence_value': 1
				}
			}
		);
		return increment.value.sequence_value;

	},

}
