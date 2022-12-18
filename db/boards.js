'use strict';

const Mongo = require(__dirname+'/db.js')
	, cache = require(__dirname+'/../lib/redis/redis.js')
	, dynamicResponse = require(__dirname+'/../lib/misc/dynamic.js')
	, escapeRegExp = require(__dirname+'/../lib/input/escaperegexp.js')
	, db = Mongo.db.collection('boards')
	, config = require(__dirname+'/../lib/misc/config.js');

module.exports = {

	db,

	findOne: async (name) => {
		let board = await cache.get(`board:${name}`);
		if (board) {
			return board === 'no_exist' ? null : board;
		} else {
			board = await db.findOne({ '_id': name });
			if (board) {
				//should really handle this in every db find
				for (let staff in board.staff) {
					board.staff[staff].permissions = board.staff[staff].permissions.toString('base64');
				}
				cache.set(`board:${name}`, board, 3600);
				if (board.banners.length > 0) {
					cache.sadd(`banners:${name}`, board.banners);
				}
			} else {
				cache.set(`board:${name}`, 'no_exist', 600);
			}
		}
		return board;
	},

	getStaffPerms: async (boards, username) => {
		return db.find({
			'_id': {
				'$in': boards,
			}
		}, {
			'projection': {
				[`staff.${username}.permissions`]: 1,
			}
		}).toArray();
	},

	randomBanner: async (name) => {
		let banner = await cache.srand(`banners:${name}`);
		if (!banner) {
			const board = await module.exports.findOne(name);
			if (board) {
				banner = board.banners[Math.floor(Math.random()*board.banners.length)];
			}
		}
		return banner;
	},

	insertOne: (data) => {
		cache.del(`board:${data._id}`); //removing cached no_exist
		if (!data.settings.unlistedLocal) {
			cache.sadd('boards:listed', data._id);
		}
		return db.insertOne(data);
	},

	deleteOne: (board) => {
		cache.del(`board:${board}`);
		cache.del(`banners:${board}`);
		cache.srem('boards:listed', board);
		cache.srem('triggered', board);
		return db.deleteOne({ '_id': board });
	},

	updateOne: (board, update) => {
		if (update['$set']
			&& update['$set'].settings
			&& update['$set'].settings.unlistedLocal !== null) {
			if (update['$set'].settings.unlistedLocal) {
				cache.srem('boards:listed', board);
			} else {
				cache.sadd('boards:listed', board);
			}
		}
		cache.del(`board:${board}`);
		return db.updateOne({
			'_id': board
		}, update);
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

	addStaff: async (board, username, permissions, setOwner=false) => {
		const update = {
			'$set': {
				[`staff.${username}`]: {
					'permissions': Mongo.Binary(permissions.array),
					'addedDate': new Date(),
				},
			},
		};
		if (setOwner === true) {
			update['$set']['owner'] = username;
		}
		const res = db.updateOne({
			'_id': board,
		}, update);
		cache.del(`board:${board}`);
		return res;
	},

	removeStaff: (board, usernames) => {
		cache.del(`board:${board}`);
		const unsetObject = usernames.reduce((acc, username) => {
			acc[`staff.${username}`] = '';
			return acc;
		}, {});
		return db.updateOne(
			{
				'_id': board,
			}, {
				'$unset': unsetObject,
			}
		);
	},

	setStaffPermissions: (board, username, permissions, setOwner = false) => {
		cache.del(`board:${board}`);
		const update = {
			'$set': {
				[`staff.${username}.permissions`]: Mongo.Binary(permissions.array),
			}
		};
		if (setOwner === true) {
			update['$set']['owner'] = username;
		}
		return db.updateOne({
			'_id': board,
		}, update);
	},

	setOwner: (board, username = null) => {
		cache.del(`board:${board}`);
		return db.updateOne({
			'_id': board,
		}, {
			'$set': {
				'owner': username,
			},
		});
	},

	addToArray: (board, key, list) => {
		return db.updateOne(
			{
				'_id': board,
			}, {
				'$push': {
					[key]: {
						'$each': list
					}
				}
			}
		);

	},

	removeFromArray: (board, key, list) => {
		return db.updateOne(
			{
				'_id': board,
			}, {
				'$pullAll': {
					[key]: list
				}
			}
		);
	},

	removeBanners: (board, filenames) => {
		cache.del(`board:${board}`);
		cache.del(`banners:${board}`);
		return module.exports.removeFromArray(board, 'banners', filenames);
	},

	addBanners: (board, filenames) => {
		cache.del(`board:${board}`);
		cache.del(`banners:${board}`);
		return module.exports.addToArray(board, 'banners', filenames);
	},

	removeAssets: (board, filenames) => {
		cache.del(`board:${board}`);
		return module.exports.removeFromArray(board, 'assets', filenames);
	},

	addAssets: (board, filenames) => {
		cache.del(`board:${board}`);
		return module.exports.addToArray(board, 'assets', filenames);
	},

	setFlags: (board, flags) => {
		cache.del(`board:${board}`);
		//could use dot notation and set flags.x for only changes? seems a bit unsafe though and couldnt have . in name
		return db.updateOne({
			'_id': board,
		}, {
			'$set': {
				'flags': flags,
			}
		});
	},

	getLocalListed: async () => {
		let cachedListed = await cache.sgetall('boards:listed');
		if (cachedListed && cachedListed.length > 0) {
			return cachedListed;
		}
		let listedBoards = await db.find({
			'settings.unlistedLocal': false
		}, {
			'projection': {
				'_id': 1,
			}
		}).toArray();
		if (listedBoards.length == 0) {
			return [];
		}
		listedBoards = listedBoards.map(b => b._id);
		await cache.sadd('boards:listed', listedBoards);
		return listedBoards;
	},

	boardSort: (skip=0, limit=50, sort={ ips:-1, pph:-1, sequence_value:-1 }, filter={}, showSensitive=false, webringSites=false) => {
		const addedFilter = {};
		const projection = {
			'_id': 1,
			'uri': 1,
			'lastPostTimestamp': 1,
			'sequence_value': 1,
			'pph': 1,
			'ppd': 1,
			'ips': 1,
			'settings.sfw': 1,
			'settings.description': 1,
			'settings.name': 1,
			'tags': 1,
			'path': 1,
			'siteName': 1,
			'webring': 1,
			'settings.unlistedLocal': 1,
		};
		if (webringSites) {
			addedFilter['siteName'] = {
				'$in': webringSites,
			};
		}
		if (!showSensitive) {
			addedFilter['settings.unlistedLocal'] = { '$ne': true };
			if (!webringSites) {
				addedFilter['webring'] = false;
			}
		} else {
			if (filter.filter_sfw) {
				addedFilter['settings.sfw'] = true;
			}
			if (filter.filter_unlisted) {
				addedFilter['settings.unlistedLocal'] = true;
			}
			if (filter.filter_abandoned) {
				addedFilter['owner'] = null;
			}
			addedFilter['webring'] = false;
			projection['staff'] = 1;
			projection['owner'] = 1;
		}
		if (filter.search) {
			const prefixRegExp = new RegExp(`^${escapeRegExp(filter.search)}`, 'i');
			addedFilter['$or'] = [
				{ 'tags': prefixRegExp },
				{ 'uri': prefixRegExp },
				{ '_id': prefixRegExp },
			];
		}
		return db.find(addedFilter, { projection })
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.toArray();
	},

	webringBoards: () => {
		return db.find({
			'webring': false,
			'settings.unlistedWebring': false,
		}, {
			'projection': {
				'_id': 1,
				'lastPostTimestamp': 1,
				'sequence_value': 1,
				'pph': 1,
				'ppd': 1,
				'ips': 1,
				'settings.sfw': 1,
				'settings.description': 1,
				'settings.name': 1,
				'tags': 1,
			}
		}).toArray();
	},
	
	getAbandoned: (action=0) => {
		const filter = {
			'webring': false,
			'owner': null,
		};
		if (action === 1) {
			//if just locking, only match unlocked boards
			filter['settings.lockMode'] = { '$lt': 2 };
		} else if (action === 2) {
			//if locking+unlisting, match ones that satisfy any of the conditions
			filter['$or'] = [
				{ 'settings.unlistedWebring': false },
				{ 'settings.unlistedLocal': false },
				{ 'settings.lockMode': { '$lt': 2 } },
			];
		}
		//else we return boards purely based on owner: null because they are going to be deleted anyway
		return db
			.find(filter)
			.toArray();
	},

	unlistMany: (boards) => {
		const update = {
			'settings.lockMode': 2,
		};
		if (config.get.abandonedBoardAction === 2) {
			update['settings.unlistedLocal'] = true;
			update['settings.unlistedWebring'] = true;
		}
		cache.srem('boards:listed', boards);
		cache.del(boards.map(b => `board:${b}`));
		return db.updateMany({
			'_id': {
				'$in': boards,
			},
		}, {
			'$set': update,
		});
	},

	count: (filter, showSensitive=false, webringSites=false) => {
		const addedFilter = {};
		if (webringSites) {
			addedFilter['siteName'] = {
				'$in': webringSites,
			};
		}
		if (!showSensitive) {
			addedFilter['settings.unlistedLocal'] = { $ne: true };
		} else {
			if (filter.filter_sfw) {
				addedFilter['settings.sfw'] = true;
			}
			if (filter.filter_unlisted) {
				addedFilter['settings.unlistedLocal'] = true;
			}
			if (filter.filter_abandoned) {
				addedFilter['owner'] = null;
			}
			addedFilter['webring'] = false;
		}
		if (filter.search) {
			const prefixRegExp = new RegExp(`^${escapeRegExp(filter.search)}`, 'i');
			addedFilter['$or'] = [
				{ 'tags': prefixRegExp },
				{ 'uri': prefixRegExp },
				{ '_id': prefixRegExp },
			];
		}
		return db.countDocuments(addedFilter);
	},

	webringSites: async () => {
		let webringSites = await cache.get('webringsites');
		if (!webringSites) {
			webringSites = await db.aggregate([
				{
					'$match': {
						'webring': true
					},
				},
				{
					'$group': {
						'_id': null,
						'sites': {
							'$addToSet': '$siteName'
						}
					}
				}
			])
				.toArray()
				.then(res => {
					if (res.length > 0 && res[0].sites) {
						return res[0].sites.sort((a, b) => a.localeCompare(b));
					}
					return [];
				});
			cache.set('webringsites', webringSites);
		}
		return webringSites;
	},

	totalStats: () => {
		return db.aggregate([
			{
				'$group': {
					'_id': '$webring',
					'posts': {
						'$sum': '$sequence_value'
					},
					'pph': {
						'$sum': '$pph'
					},
					'ppd': {
						'$sum': '$ppd'
					},
					'total': {
						'$sum': 1
					},
					'sites': {
						'$addToSet': '$siteName'
					},
					'unlisted': {
						'$sum': {
							'$cond': ['$settings.unlistedLocal', 1, 0]
						}
					},
				}
			},
			{
				'$project': {
					'_id': 1,
					'posts': 1,
					'pph': 1,
					'ppd': 1,
					'total': 1,
					'sites': {
						'$size': '$sites'
					},
					'unlisted': 1,
				}
			}
		])
			.toArray()
			.then(res => {
				res.sort(a => a._id ? 1 : -1);
				return res;
			});
	},

	exists: async (req, res, next) => {
		const board = await module.exports.findOne(req.params.board);
		if (!board) {
			return res.status(404).render('404');
		}
		res.locals.board = board;
		next();
	},

	bodyExists: async (req, res, next) => {
		const board = await module.exports.findOne(req.body.board);
		if (!board) {
			return dynamicResponse(req, res, 404, '404', {
				'title': 'Bad request',
				'message': 'Board does not exist',
			});
		}
		res.locals.board = board;
		next();
	},

	triggerModes: (boards) => {
		return db.aggregate([
			{
				'$match': {
					'_id': {
						'$in': boards
					}
				}
			}, {
				'$project': {
					'_id': 1,
					'lockMode': '$settings.lockMode',
					'lockReset': '$settings.lockReset',
					'captchaMode': '$settings.captchaMode',
					'captchaReset': '$settings.captchaReset',
					'threadLimit': '$settings.threadLimit',
				}
			}
		]).toArray();
	},

	getNextId: async (board, saged, amount=1) => {
		const update = {
			'$inc': {
				'sequence_value': amount
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
			},
			update,
			{
				'projection': {
					'sequence_value': 1
				}
			}
		);
		return increment.value.sequence_value;
	},

};
