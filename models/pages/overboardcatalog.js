'use strict';

const { Posts, Boards } = require(__dirname+'/../../db/')
	, cache = require(__dirname+'/../../redis.js')
	, config = require(__dirname+'/../../config.js');

module.exports = async (req, res, next) => {

	const { overboardCatalogLimit } = config.get;

	let threads = (await cache.get('catalog')) || [];
	if (!threads || threads.length === 0) {
		try {
			const listedBoards = await Boards.getLocalListed();
			threads = await Posts.getCatalog(listedBoards, false, overboardCatalogLimit);
			cache.set('catalog', threads, 60);
		} catch (err) {
			return next(err);
		}
	}

	res
	.set('Cache-Control', 'public, max-age=60')
	.render('overboardcatalog', {
		threads,
	});

}
