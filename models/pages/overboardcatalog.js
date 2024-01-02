'use strict';

const { Posts, Boards } = require(__dirname+'/../../db/')
	, cache = require(__dirname+'/../../lib/redis/redis.js')
	, config = require(__dirname+'/../../lib/misc/config.js');

module.exports = async (req, res, next) => {

	const { overboardCatalogLimit, allowCustomOverboard } = config.get;

	let selectedBoards = []
		, addBoards = []
		, removeBoards = []
		, removeBoardsSet = new Set()
		, includeDefault = true
		, cacheQueryString = '';

	if (allowCustomOverboard === true) {
		const addList = (req.query.add ? (typeof req.query.add === 'string' ? req.query.add.split(',') : req.query.add) : [])
			.slice(0, overboardCatalogLimit)
			.map(b => b.trim())
			.filter(b => b)
			.sort();
		const removeList = (req.query.rem ? (typeof req.query.rem === 'string' ? req.query.rem.split(',') : req.query.rem) : [])
			.slice(0, overboardCatalogLimit)
			.map(b => b.trim())
			.filter(b => b)
			.sort();
		addBoards = [...new Set(addList)];
		removeBoardsSet = new Set(removeList);
		removeBoards = [...removeBoardsSet];
		includeDefault = req.query.include_default === 'true';
		if (!includeDefault && addBoards.length === 0) {
			includeDefault = true;
		}
		const cacheQuery = new URLSearchParams({ include_default: includeDefault, add: addBoards, rem: removeBoards });
		cacheQuery.sort();
		cacheQueryString = cacheQuery.toString();
	}

	let threads = (await cache.get(`catalog:${cacheQueryString}`)) || [];
	if (!threads || threads.length === 0) {
		try {
			let listedBoards = [];
			if (includeDefault) {
				listedBoards = await Boards.getLocalListed();
			}
			selectedBoards = listedBoards
				.concat(addBoards)
				.filter(b => !removeBoardsSet.has(b));
			threads = await Posts.getCatalog(selectedBoards, false, overboardCatalogLimit);
			cache.set(`catalog:${cacheQueryString}`, threads, 30);
		} catch (err) {
			return next(err);
		}
	}

	res
		.set('Cache-Control', 'public, max-age=60');

	if (req.path === '/catalog.json') {
		res.json({
			threads,
		});
	} else {
		res.render('overboardcatalog', {
			threads,
			includeDefault,
			addBoards,
			removeBoards,
			selectedBoards,
			cacheQueryString,
			allowCustomOverboard,
		});
	}

};
