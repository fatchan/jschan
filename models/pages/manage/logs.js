'use strict';

const { Modlogs } = require(__dirname+'/../../../db/')
	, pageQueryConverter = require(__dirname+'/../../../lib/input/pagequeryconverter.js')
	, { Permissions } = require(__dirname+'/../../../lib/permission/permissions.js')
//	, decodeQueryIP = require(__dirname+'/../../../lib/input/decodequeryip.js')
	, limit = 50;

module.exports = async (req, res, next) => {

	const { page, offset, queryString } = pageQueryConverter(req.query, limit);

	let filter = {
		board: req.params.board
	};
	const username = typeof req.query.username === 'string' ? req.query.username : null;
	if (username) {
		filter.user = username;
	}

	let logs, maxPage;
	try {
		[logs, maxPage] = await Promise.all([
			Modlogs.find(filter, offset, limit),
			Modlogs.count(filter),
		]);
		maxPage = Math.ceil(maxPage/limit);
	} catch (err) {
		return next(err);
	}

	res
		.set('Cache-Control', 'private, max-age=5')
		.render('managelogs', {
			csrf: req.csrfToken(),
			queryString,
			username,
			permissions: res.locals.permissions,
			viewRawIp: res.locals.permissions.get(Permissions.VIEW_RAW_IP),
			logs,
			page,
			maxPage,
		});

};
