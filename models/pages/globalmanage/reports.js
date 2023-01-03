'use strict';

const { Posts } = require(__dirname+'/../../../db/')
	, pageQueryConverter = require(__dirname+'/../../../lib/input/pagequeryconverter.js')
	, { Permissions } = require(__dirname+'/../../../lib/permission/permissions.js')
	, decodeQueryIP = require(__dirname+'/../../../lib/input/decodequeryip.js')
	, limit = 20;

module.exports = async (req, res, next) => {

	const { page, offset, queryString } = pageQueryConverter(req.query, limit);
	let ipMatch = decodeQueryIP(req.query, res.locals.permissions);

	let reports;
	try {
		reports = await Posts.getGlobalReports(offset, limit, ipMatch, res.locals.permissions);
	} catch (err) {
		return next(err);
	}

	res.set('Cache-Control', 'private, max-age=5');

	if (req.path.endsWith('/reports.json')) {
		res.json({
			reports,
			page,
			ip: ipMatch ? req.query.ip : null,
			queryString,
		});
	} else {
		res.render('globalmanagereports', {
			csrf: req.csrfToken(),
			reports,
			permissions: res.locals.permissions,
			viewRawIp: res.locals.permissions.get(Permissions.VIEW_RAW_IP),
			page,
			ip: ipMatch ? req.query.ip : null,
			queryString,
		});
	}

};
