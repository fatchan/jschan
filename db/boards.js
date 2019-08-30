'use strict';

const Mongo = require(__dirname+'/db.js')
	, cache = require(__dirname+'/../redis.js')
	, db = Mongo.client.db('jschan').collection('boards');

module.exports = {

	db,

	findOne: async (name) => {
		const cacheKey = `board_${name}`;
		let board = await cache.get(cacheKey);
		if (board && board !== 'no_exist') {
			return board;
		} else {
			board = await db.findOne({ '_id': name });
			if (board) {
				cache.set(cacheKey, board);
			} else {
				cache.set(cacheKey, 'no_exist');
			}
		}
		return board;
	},

	setOwner: (board, username) => {
		cache.del(`board_${board}`);
		return db.updateOne({
			'_id': board
		}, {
			'$set': {
				'owner': username
			}
		});
	},

	find: () => {
		return db.find({}).toArray();
	},

	insertOne: (data) => {
		cache.del(`board_${data._id}`); //removing cached no_exist
		return db.insertOne(data);
	},

	deleteOne: (board) => {
		cache.del(`board_${board}`);
		return db.deleteOne({ '_id': board });
	},

	deleteAll: (board) => {
		return db.deleteMany({});
	},

	removeBanners: (board, filenames) => {
		cache.del(`board_${board}`);
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
		cache.del(`board_${board}`);
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
		res.locals.board = board;
		next();
	},

	getNextId: async (board) => {
		//cache.del(`board_${board}`); //dont need to clear cache for this? only time this value is used, its fetched from db.
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
