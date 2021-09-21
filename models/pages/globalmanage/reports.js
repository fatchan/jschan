'use strict';

const { Posts } = require(__dirname+'/../../../db/')
	, pageQueryConverter = require(__dirname+'/../../../helpers/pagequeryconverter.js')
	, decodeQueryIP = require(__dirname+'/../../../helpers/decodequeryip.js')
	, limit = 20;

module.exports = async (req, res, next) => {

	const { page, offset, queryString } = pageQueryConverter(req.query, limit);
	let ipMatch = decodeQueryIP(req.query, res.locals.permLevel);

	let reports;
	try {
		reports = await Posts.getGlobalReports(offset, limit, ipMatch, res.locals.permLevel);
	} catch (err) {
		return next(err)
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
			page,
			ip: ipMatch ? req.query.ip : null,
			queryString,
		});
	}

}
