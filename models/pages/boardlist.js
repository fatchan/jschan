'use strict';

const config = require(__dirname+'/../../config.js')
	, { Boards, Webring } = require(__dirname+'/../../db/')
	, cache = require(__dirname+'/../../redis.js')
	, { relativeColor, relativeString } = require(__dirname+'/../../helpers/timeutils.js')
	, pageQueryConverter = require(__dirname+'/../../helpers/pagequeryconverter.js')
	, limit = 20;

module.exports = async (req, res, next) => {

	const { enableWebring } = config.get;
	const { page, offset, queryString } = pageQueryConverter(req.query, limit);
	const direction = req.query.direction && req.query.direction === 'asc' ? 1 : -1;
	const search = (typeof req.query.search === 'string' ? req.query.search : null);
	let sort = req.query.sort && req.query.sort === 'activity' ? 'activity' : 'popularity';

	const cacheQuery = new URLSearchParams({ direction, sort, search, page });
	cacheQuery.sort();
	const cacheQueryString = cacheQuery.toString();
	const cached = await cache.get(`boardlist:${cacheQueryString}`);

	let localBoards, webringBoards, localPages, webringPages, maxPage;
	if (cached) {
		({ localBoards, webringBoards, localPages, webringPages, maxPage } = cached);
	} else {
		if (sort === 'activity') {
			sort = {
				'lastPostTimestamp': direction
			}
		} else {
			sort = {
				'ips': direction,
				'pph': direction,
				'sequence_value': direction
			};
		}

		let filter = {};
		if (req.query.search && search) {
			filter = {
				'search': search
			}
		}

		try {
			[ localBoards, localPages, webringBoards, webringPages ] = await Promise.all([
				Boards.boardSort(offset, limit, sort, filter),
				Boards.count(filter),
				enableWebring ? Webring.boardSort(offset, limit, sort, filter) : null,
				enableWebring ? Webring.count(filter) : 0,
			]);
			localPages = Math.ceil(localPages / limit);
			webringPages = Math.ceil(webringPages / limit);
			maxPage = Math.max(localPages, webringPages);
		} catch (err) {
			return next(err);
		}
		const now = new Date();
		if (localBoards) {
			for (let i = 0; i < localBoards.length; i++) {
				if (localBoards[i].lastPostTimestamp) {
					const lastPostDate = new Date(localBoards[i].lastPostTimestamp);
					localBoards[i].lastPostTimestamp = {
						text: relativeString(now, lastPostDate),
						color: relativeColor(now, lastPostDate)
					}
				}
			}
		}
		if (webringBoards) {
			for (let i = 0; i < webringBoards.length; i++) {
				if (webringBoards[i].lastPostTimestamp) {
					const lastPostDate = new Date(webringBoards[i].lastPostTimestamp);
					webringBoards[i].lastPostTimestamp = {
						text: relativeString(now, lastPostDate),
						color: relativeColor(now, lastPostDate)
					}
				}
			}
		}
		cache.set(`boardlist:${cacheQueryString}`, { localBoards, localPages, webringBoards, webringPages, maxPage }, 60);
	}

	res
	.set('Cache-Control', 'public, max-age=60');

	if (req.path === '/boards.json') {
		res.json({
			localBoards,
			webringBoards,
			page,
			maxPage,
		});
	} else {
		res.render('boardlist', {
			localBoards,
			webringBoards,
			page,
			maxPage,
			query: req.query,
			search,
			queryString,
		});
	}

}
