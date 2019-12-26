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
				cache.set(`board_${name}`, board, 3600);
				if (board.banners.length > 0) {
					cache.sadd(`banners_${name}`, board.banners);
				}
			} else {
				cache.set(`board_${name}`, 'no_exist', 600);
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

	insertOne: (data) => {
		cache.del(`board_${data._id}`); //removing cached no_exist
		cache.set('webring_update', 1);
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

	boardSort: (skip=0, limit=50, sort={ ips:-1, pph:-1, sequence_value:-1 }, filter={}, showUnlisted=false) => {
		const addedFilter = {};
		if (!showUnlisted) {
			addedFilter['settings.unlisted'] = false;
		}
		if (filter.search) {
			addedFilter['$or'] = [
				{ 'settings.tags': filter.search },
				{ '_id':  filter.search },
			];
		}
		return db.find(addedFilter, {
			'projection': {
				'_id': 1,
				'lastPostTimestamp': 1,
				'sequence_value': 1,
				'pph': 1,
				'ips': 1,
				'settings.sfw': 1,
				'settings.description': 1,
				'settings.name': 1,
				'settings.tags': 1,
				'settings.unlisted': 1,
			}
		})
		.sort(sort)
		.skip(skip)
		.limit(limit)
		.toArray();
	},

	webringBoards: () => {
		return db.find({
			'settings.webring': true
		}, {
			'projection': {
				'_id': 1,
				'lastPostTimestamp': 1,
				'sequence_value': 1,
				'pph': 1,
				'ips': 1,
				'settings.sfw': 1,
				'settings.description': 1,
				'settings.name': 1,
				'settings.tags': 1,
			}
		}).toArray();
	},

	count: (filter, showUnlisted=false) => {
		const addedFilter = {};
		if (!showUnlisted) {
			addedFilter['settings.unlisted'] = false;
		}
		if (filter.search) {
			addedFilter['$or'] = [
				{ 'settings.tags': filter.search },
				{ '_id':  filter.search },
			];
		}
		return db.countDocuments(addedFilter);
	},

	totalStats: () => {
		return db.aggregate([
			{
				'$group': {
					'_id': null,
					'posts': {
						'$sum': '$sequence_value'
					},
					'pph': {
						'$sum': '$pph'
					},
					'total': {
						'$sum': 1
					},
					'unlisted': {
						'$sum': {
							'$cond': ['$settings.unlisted', 1, 0]
						}
					},
					//removed ips because sum is inaccurate
				}
			}
		]).toArray().then(res => res[0]);
	},

	exists: async (req, res, next) => {
		const board = await module.exports.findOne(req.params.board);
		if (!board) {
			return res.status(404).render('404');
		}
		res.locals.board = board;
		next();
	},

	getNextId: async (board, saged) => {
		const update = {
			'$inc': {
				'sequence_value': 1
			},
		};
		if (!saged) {
			update['$set'] = {
				'lastPostTimestamp': new Date()
			};
		}
		const increment = await db.findOneAndUpdate(
			{
				'_id': board
			}, update, {
				'projection': {
					'sequence_value': 1
				}
			}
		);
		return increment.value.sequence_value;
	},

}
