'use strict';

const { Posts } = require(__dirname+'/../../../db/')
	, config = require(__dirname+'/../../../lib/misc/config.js')
	, pageQueryConverter = require(__dirname+'/../../../lib/input/pagequeryconverter.js')
	, { Permissions } = require(__dirname+'/../../../lib/permission/permissions.js')
	, decodeQueryIP = require(__dirname+'/../../../lib/input/decodequeryip.js')
	, limit = 20;

module.exports = async (req, res, next) => {

	const { dontStoreRawIps } = config.get;
	const { page, offset, queryString } = pageQueryConverter(req.query, limit);
	let ipMatch = decodeQueryIP(req.query, res.locals.permissions);

	let posts;
	try {
		posts = await Posts.getBoardRecent(offset, limit, ipMatch, null, res.locals.permissions);
	} catch (err) {
		return next(err);
	}

	res.set('Cache-Control', 'private, max-age=5');

	if (req.path.endsWith('.json')) {
		res.json(posts.reverse());
	} else {
		res.render('globalmanagerecent', {
			csrf: req.csrfToken(),
			posts,
			permissions: res.locals.permissions,
			viewRawIp: res.locals.permissions.get(Permissions.VIEW_RAW_IP) && !dontStoreRawIps,
			page,
			ip: ipMatch ? req.query.ip : null,
			queryString,
		});
	}
};
