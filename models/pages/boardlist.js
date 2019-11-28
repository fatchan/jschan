'use strict';

const { enableWebring } = require(__dirname+'/../../configs/main.json')
	, { Boards, Webring } = require(__dirname+'/../../db/')
	, { relativeString } = require(__dirname+'/../../helpers/timeutils.js')
	, pageQueryConverter = require(__dirname+'/../../helpers/pagequeryconverter.js')
	, limit = 20;

module.exports = async (req, res, next) => {

	const { page, offset, queryString } = pageQueryConverter(req.query, limit);

	const direction = req.query.direction && req.query.direction === '1' ? 1 : -1;
	let sort
	if (req.query.sort && req.query.sort === 'activity') {
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
	const search = !Array.isArray(req.query.search) ? req.query.search : null;
	if (req.query.search && search) {
		filter = {
			'search': search
		}
	}

	let localBoards, webringBoards, localPages, webringPages;
	try {
		[ localBoards, localPages, webringBoards, webringPages ] = await Promise.all([
			Boards.boardSort(offset, limit, sort, filter),
			Boards.count(),
			enableWebring ? Webring.boardSort(offset, limit, sort, filter) : null,
			enableWebring ? Webring.count() : 0,
		]);
		localPages = Math.ceil(localPages / limit);
		webringPages = Math.ceil(webringPages / limit);
	} catch (err) {
		return next(err);
	}
	const maxPage = Math.max(localPages, webringPages);

	const now = new Date();
	if (localBoards) {
		for (let i = 0; i < localBoards.length; i++) {
			if (localBoards[i].lastPostTimestamp) {
				localBoards[i].lastPostTimestamp = relativeString(now, new Date(localBoards[i].lastPostTimestamp));
			}
		}
	}
	if (webringBoards) {
		for (let i = 0; i < webringBoards.length; i++) {
			if (webringBoards[i].lastPostTimestamp) {
				webringBoards[i].lastPostTimestamp = relativeString(now, new Date(webringBoards[i].lastPostTimestamp));
			}
		}
	}

	return res.render('boardlist', {
		localBoards,
		webringBoards,
		page,
		maxPage,
		query: req.query,
		search,
		queryString,
	});

}
