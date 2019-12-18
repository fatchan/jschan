'use strict';

const { Posts } = require(__dirname+'/../../../db/')
	, pageQueryConverter = require(__dirname+'/../../../helpers/pagequeryconverter.js')
	, decodeQueryIP = require(__dirname+'/../../../helpers/decodequeryip.js')
	, limit = 20;

module.exports = async (req, res, next) => {

	const { page, offset, queryString } = pageQueryConverter(req.query, limit);
	let ipMatch = decodeQueryIP(req.query);

	let reports;
	try {
		reports = await Posts.getGlobalReports(offset, limit, ipMatch);
	} catch (err) {
		return next(err)
	}

	res.render('globalmanagereports', {
		csrf: req.csrfToken(),
		reports,
		page,
		ip: ipMatch ? req.query.ip : null,
		queryString,
	});

}
