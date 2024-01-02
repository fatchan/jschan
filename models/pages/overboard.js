'use strict';

const { Posts, Boards } = require(__dirname+'/../../db/')
	, cache = require(__dirname+'/../../lib/redis/redis.js')
	, config = require(__dirname+'/../../lib/misc/config.js');

module.exports = async (req, res, next) => {

	const { overboardLimit, allowCustomOverboard, overboardReverseLinks } = config.get;

	let selectedBoards = []
		, addBoards = []
		, removeBoards = []
		, removeBoardsSet = new Set()
		, includeDefault = true
		, cacheQueryString = '';

	if (allowCustomOverboard === true) {
		//sliced to overboardLimit optimisation because there could only be max 1 thread from each of unique boards anyway
		const addList = (req.query.add ? (typeof req.query.add === 'string' ? req.query.add.split(',') : req.query.add) : [])
			.slice(0, overboardLimit)
			.map(b => b.trim())
			.filter(b => b)
			.sort();
		const removeList = (req.query.rem ? (typeof req.query.rem === 'string' ? req.query.rem.split(',') : req.query.rem) : [])
			.slice(0, overboardLimit)
			.map(b => b.trim())
			.filter(b => b)
			.sort();
		addBoards = [...new Set(addList)];
		removeBoardsSet = new Set(removeList);
		removeBoards = [...removeBoardsSet];
		includeDefault = req.query.include_default === 'true';
		if (!includeDefault && addBoards.length === 0) {
			//...really?
			includeDefault = true;
		}
		//similar to board list
		const cacheQuery = new URLSearchParams({ include_default: includeDefault, add: addBoards, rem: removeBoards });
		cacheQuery.sort();
		cacheQueryString = cacheQuery.toString();
	}

	let threads = (await cache.get(`overboard:${cacheQueryString}`)) || [];
	if (!threads || threads.length === 0) {
		try {
			let listedBoards = [];
			if (includeDefault) {
				listedBoards = await Boards.getLocalListed();
			}
			selectedBoards = listedBoards
				.concat(addBoards)
				.filter(b => !removeBoardsSet.has(b));
			threads = await Posts.getRecent(selectedBoards, 1, overboardLimit, false, false);
			cache.set(`overboard:${cacheQueryString}`, threads, 30);
		} catch (err) {
			return next(err);
		}
	}

	res
		.set('Cache-Control', 'public, max-age=60');

	if (req.path === '/overboard.json') {
		res.json({
			threads,
		});
	} else {
		res.render('overboard', {
			threads,
			includeDefault,
			addBoards,
			removeBoards,
			selectedBoards,
			cacheQueryString,
			allowCustomOverboard,
			overboardReverseLinks,
		});
	}

};
