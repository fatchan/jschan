'use strict';

const { Posts, Boards } = require(__dirname+'/../../db/')
	, cache = require(__dirname+'/../../redis.js')
	, config = require(__dirname+'/../../config.js');

module.exports = async (req, res, next) => {

	const { overboardCatalogLimit } = config.get;

	let selectedBoards = [];
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
	const addBoards = [...new Set(addList)]
	const removeBoardsSet = new Set(removeList);
	const removeBoards = [...removeBoardsSet];
	let includeDefault = req.query.include_default === 'true';
	if (!includeDefault && addBoards.length === 0 && removeBoards.length === 0) {
		includeDefault = true;
	}

	const cacheQuery = new URLSearchParams({ include_default: includeDefault, add: addBoards, rem: removeBoards });
	cacheQuery.sort();
	const cacheQueryString = cacheQuery.toString();

	let threads = (await cache.get(`catalog:${cacheQueryString}`)) || [];
	if (!threads || threads.length === 0) {
		try {
			let listedBoards = []
			if (includeDefault) {
				listedBoards = await Boards.getLocalListed();
			}
			selectedBoards = listedBoards
				.concat(addBoards)
				.filter(b => !removeBoardsSet.has(b));
			threads = await Posts.getCatalog(selectedBoards, false, overboardCatalogLimit);
			cache.set(`catalog:${cacheQueryString}`, threads, 60);
		} catch (err) {
			return next(err);
		}
	}

	res
	.set('Cache-Control', 'public, max-age=60')
	.render('overboardcatalog', {
		threads,
		includeDefault,
		addBoards,
		removeBoards,
		selectedBoards,
		cacheQueryString,
	});

}
