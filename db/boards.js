'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan').collection('boards');

module.exports = {

	db,

	findOne: (name) => {
		return db.findOne({ '_id': name });
	},

	find: () => {
		return db.find({}).toArray();
	},

	insertOne: (data) => {
		return db.insertOne(data);
	},

	deleteOne: (board) => {
		return db.deleteOne({ '_id': board });
	},

	deleteAll: (board) => {
		return db.deleteMany({});
	},

	removeBanners: (board, filenames) => {
		return db.updateOne(
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
		return db.updateOne(
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

	frontPageSortLimit: () => {
		return db.find({}).sort({
			'ips': -1,
			'pph': -1,
			'sequence_value': -1,
  		}).limit(20).toArray();
	},

	totalPosts: () => {
		return db.aggregate([
			{
				'$group': {
					'_id': null,
					'total': {
						'$sum': '$sequence_value'
					}
				}
			}
		]).toArray().then(res => res[0].total);
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

		const increment = await db.findOneAndUpdate(
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
