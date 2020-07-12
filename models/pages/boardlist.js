'use strict';

const { enableWebring } = require(__dirname+'/../../configs/main.js')
	, { Boards, Webring } = require(__dirname+'/../../db/')
	, cache = require(__dirname+'/../../redis.js')
	, { relativeColor, relativeString } = require(__dirname+'/../../helpers/timeutils.js')
	, pageQueryConverter = require(__dirname+'/../../helpers/pagequeryconverter.js')
	, limit = 20;

module.exports = async (req, res, next) => {

	const isGlobalStaff = res.locals.permLevel <= 1;
	const { page, offset, queryString } = pageQueryConverter(req.query, limit);
	const direction = req.query.direction && req.query.direction === 'asc' ? 1 : -1;
	const search = (typeof req.query.search === 'string' ? req.query.search : null);
	let sort = req.query.sort && req.query.sort === 'activity' ? 'activity' : 'popularity';

	const cacheQuery = new URLSearchParams({ direction, sort, search, page });
	cacheQuery.sort();
	const cacheQueryString = cacheQuery.toString();
	const cached = await cache.get(cacheQueryString);

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
				Boards.boardSort(offset, limit, sort, filter, isGlobalStaff),
				Boards.count(filter, isGlobalStaff),
				enableWebring ? Webring.boardSort(offset, limit, sort, filter, isGlobalStaff) : null,
				enableWebring ? Webring.count(filter) : 0,
			]);
			localPages = Math.ceil(localPages / limit);
			webringPages = Math.ceil(webringPages / limit);
			maxPage = Math.max(localPages, webringPages);
		} catch (err) {
			return next(err);
		}

		if (!isGlobalStaff) {
			cache.set(cacheQueryString, { localBoards, localPages, webringBoards, webringPages, maxPage }, 60);
		}
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

	res
	.set('Cache-Control', `${isGlobalStaff ? 'private' : 'public'}, max-age=60`)
	.render('boardlist', {
		localBoards,
		webringBoards,
		page,
		maxPage,
		query: req.query,
		search,
		queryString,
	});

}
