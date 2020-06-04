'use strict';

const { Posts } = require(__dirname+'/../../../db/')
	, decodeQueryIP = require(__dirname+'/../../../helpers/decodequeryip.js')
	, pageQueryConverter = require(__dirname+'/../../../helpers/pagequeryconverter.js')
	, limit = 20;

module.exports = async (req, res, next) => {

	const { page, offset, queryString } = pageQueryConverter(req.query, limit);
	let ip = decodeQueryIP(req.query, res.locals.permLevel);
	const postId = typeof req.query.postid === 'string' ? req.query.postid : null;
	if (postId && +postId === parseInt(postId) && Number.isSafeInteger(+postId)) {
		const fetchedPost = await Posts.getPost(req.params.board, +postId, true);
		if (fetchedPost) {
			ip = decodeQueryIP({ ip: fetchedPost.ip.single.slice(-10) }, res.locals.permlevel);
		}
	}

	let posts;
	try {
		posts = await Posts.getBoardRecent(offset, limit, ip, req.params.board);
	} catch (err) {
		return next(err)
	}

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('managerecent', {
		csrf: req.csrfToken(),
		posts,
		page,
		postId,
		queryIp: ip ? req.query.ip : null,
		queryString,
	});

}
