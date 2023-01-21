'use strict';

const { Boards } = require(__dirname+'/../../../db/')
	, { relativeColor, relativeString } = require(__dirname+'/../../../lib/converter/timeutils.js')
	, pageQueryConverter = require(__dirname+'/../../../lib/input/pagequeryconverter.js')
	, limit = 20;

module.exports = async (req, res, next) => {

	const { page, offset, queryString } = pageQueryConverter(req.query, limit);
	const direction = req.query.direction && req.query.direction === 'asc' ? 1 : -1;
	const search = (typeof req.query.search === 'string' ? req.query.search : null);
	let sort = req.query.sort && req.query.sort === 'activity' ? 'activity' : 'popularity';

	if (sort === 'activity') {
		sort = {
			'lastPostTimestamp': direction
		};
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
		};
	}
	filter.filter_sfw = req.query.filter_sfw != null;
	filter.filter_abandoned = req.query.filter_abandoned != null;
	filter.filter_unlisted = req.query.filter_unlisted != null;

	let localBoards, pages, maxPage;
	try {
		[ localBoards, pages ] = await Promise.all([
			Boards.boardSort(offset, limit, sort, filter, true),
			Boards.count(filter, true),
		]);
		maxPage = Math.ceil(pages / limit);
	} catch (err) {
		return next(err);
	}

	const now = new Date();
	if (localBoards) {
		for (let i = 0; i < localBoards.length; i++) {
			if (localBoards[i].lastPostTimestamp) {
				const lastPostDate = new Date(localBoards[i].lastPostTimestamp);
				localBoards[i].lastPostTimestamp = {
					text: relativeString(now, lastPostDate, res.locals),
					color: relativeColor(now, lastPostDate)
				};
			}
		}
	}
	res.set('Cache-Control', 'private, max-age=60');

	if (req.path.endsWith('/boards.json')) {
		res.json({
			localBoards,
			page,
			maxPage,
		});
	} else {
		res.render('globalmanageboardlist', {
			localBoards,
			permissions: res.locals.permissions,
			page,
			maxPage,
			query: req.query,
			search,
			queryString,
		});
	}

};
