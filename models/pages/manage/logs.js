'use strict';

const { Modlogs } = require(__dirname+'/../../../db/')
	, { ipHashPermLevel } = require(__dirname+'/../../../configs/main.js')
	, pageQueryConverter = require(__dirname+'/../../../helpers/pagequeryconverter.js')
	, decodeQueryIP = require(__dirname+'/../../../helpers/decodequeryip.js')
	, hashIp = require(__dirname+'/../../../helpers/haship.js')
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
	const uri = typeof req.query.uri === 'string' ? req.query.uri : null;
    if (uri) {
        filter.board = uri;
    }
//todo fetch log entry by id and then get ip and hash

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
    if (ipHashPermLevel !== -1
		&& res.locals.permLevel > ipHashPermLevel) {
        for (let i = 0; i < logs.length; i++) {
            logs[i].ip = hashIp(logs[i].ip);
        }
    }

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('managelogs', {
		csrf: req.csrfToken(),
		queryString,
		username,
		uri,
//posterid here
		logs,
		page,
		maxPage,
	});

}
