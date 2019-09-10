'use strict';

const Mongo = require(__dirname+'/db.js')
	, cache = require(__dirname+'/../redis.js')
	, db = Mongo.client.db('jschan').collection('boards');

module.exports = {

	db,

	findOne: async (name) => {
		let board = await cache.get(`board_${name}`);
		if (board && board !== 'no_exist') {
			return board;
		} else {
			board = await db.findOne({ '_id': name });
			if (board) {
				cache.set(`board_${name}`, board);
				if (board.banners.length > 0) {
					cache.sadd(`banners_${name}`, board.banners);
				}
			} else {
				cache.set(`board_${name}`, 'no_exist', 'ex', 3600); //1 hour expiry just so it doesnt grow indefinitely
			}
		}
		return board;
	},

	randomBanner: async (name) => {
		let banner = await cache.srand(`banners_${name}`);
		if (!banner) {
			const board = await module.exports.findOne(name);
			if (board) {
				banner = board.banners[Math.floor(Math.random()*board.banners.length)];
			}
		}
		return banner;
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
		cache.del(`banners_${board}`);
		return db.deleteOne({ '_id': board });
	},

	updateOne: (board, update) => {
		cache.del(`board_${board}`);
		return db.updateOne({
			'_id': board
		}, update);
	},

	deleteAll: (board) => {
		/*
			no clearing redis cache here, will leave that up to gulpfile, since this happens in the
			wipe script, it would delete redis cache for everything, not just boards
		*/
		return db.deleteMany({});
	},

	removeBanners: (board, filenames) => {
		cache.del(`board_${board}`);
		cache.del(`banners_${board}`);
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
		cache.del(`banners_${board}`);
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
		return db.find({
			'settings.unlisted': false
		}).sort({
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
