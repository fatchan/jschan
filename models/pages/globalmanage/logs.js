'use strict';

const { Modlogs } = require(__dirname+'/../../../db/')
	, pageQueryConverter = require(__dirname+'/../../../helpers/pagequeryconverter.js')
	, decodeQueryIP = require(__dirname+'/../../../helpers/decodequeryip.js')
	, limit = 50;

module.exports = async (req, res, next) => {

	const { page, offset, queryString } = pageQueryConverter(req.query, limit);

    let filter = {};
	const username = req.query.username;
    if (username && !Array.isArray(username)) {
        filter.user = username;
    }
	const uri = req.query.uri;
    if (uri && !Array.isArray(uri)) {
        filter.board = uri;
    }
	const ipMatch = decodeQueryIP(req.query);
	if (ipMatch) {
		filter.ip = ipMatch;
	}

	let logs, maxPage;
	try {
		[logs, maxPage] = await Promise.all([
			Modlogs.find(filter, offset, limit),
			Modlogs.count(filter),
		]);
		maxPage = Math.ceil(maxPage/limit);
	} catch (err) {
		return next(err)
	}

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('globalmanagelogs', {
		csrf: req.csrfToken(),
		queryString,
		username,
		uri,
		ip: ipMatch ? req.query.ip : null,
		logs,
		page,
		maxPage,
	});

}
