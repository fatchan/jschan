'use strict';

const { Modlogs } = require(__dirname+'/../../../db/')
	, pageQueryConverter = require(__dirname+'/../../../lib/input/pagequeryconverter.js')
	, { Permissions } = require(__dirname+'/../../../lib/permission/permissions.js')
	, decodeQueryIP = require(__dirname+'/../../../lib/input/decodequeryip.js')
	, { isIP } = require('net')
	, limit = 50;

module.exports = async (req, res, next) => {

	const { page, offset, queryString } = pageQueryConverter(req.query, limit);

	let filter = {};
	const username = (typeof req.query.username === 'string' ? req.query.username : null);
	if (username && !Array.isArray(username)) {
		filter.user = username;
	}
	const uri = (typeof req.query.uri === 'string' ? req.query.uri : null);
	if (uri && !Array.isArray(uri)) {
		filter.board = uri;
	}
	const ipMatch = decodeQueryIP(req.query, res.locals.permissions);
	if (ipMatch != null) {
		if (isIP(ipMatch)) {
			filter['ip.raw'] = ipMatch;
		} else {
			filter['ip.cloak'] = ipMatch;
		}
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
		.render('globalmanagelogs', {
			csrf: req.csrfToken(),
			permissions: res.locals.permissions,
			queryString,
			username,
			uri,
			viewRawIp: res.locals.permissions.get(Permissions.VIEW_RAW_IP),
			ip: ipMatch ? req.query.ip : null,
			logs,
			page,
			maxPage,
		});

};
