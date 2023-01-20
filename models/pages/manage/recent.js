'use strict';

const { Posts } = require(__dirname+'/../../../db/')
	, config = require(__dirname+'/../../../lib/misc/config.js')
	, decodeQueryIP = require(__dirname+'/../../../lib/input/decodequeryip.js')
	, { Permissions } = require(__dirname+'/../../../lib/permission/permissions.js')
	, pageQueryConverter = require(__dirname+'/../../../lib/input/pagequeryconverter.js')
	, limit = 20;

module.exports = async (req, res, next) => {

	const { dontStoreRawIps } = config.get;
	const { page, offset, queryString } = pageQueryConverter(req.query, limit);
	let ip = decodeQueryIP(req.query, res.locals.permissions);
	const postId = typeof req.query.postid === 'string' ? req.query.postid : null;
	if (postId && +postId === parseInt(postId) && Number.isSafeInteger(+postId)) {
		const fetchedPost = await Posts.getPost(req.params.board, +postId, true);
		if (fetchedPost) {
			ip = decodeQueryIP({ ip: fetchedPost.ip.cloak }, res.locals.permissions);
		}
	}

	let posts;
	try {
		posts = await Posts.getBoardRecent(offset, limit, ip, req.params.board, res.locals.permissions);
	} catch (err) {
		return next(err);
	}

	res.set('Cache-Control', 'private, max-age=5');

	if (req.path.endsWith('.json')) {
		res.json(posts.reverse());
	} else {
		res.render('managerecent', {
			csrf: req.csrfToken(),
			posts,
			permissions: res.locals.permissions,
			viewRawIp: res.locals.permissions.get(Permissions.VIEW_RAW_IP) && !dontStoreRawIps,
			page,
			postId,
			queryIp: ip ? req.query.ip : null,
			queryString,
		});
	}
};
