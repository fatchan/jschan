'use strict';

const { Posts } = require(__dirname+'/../../../db/')
	, { ipHashPermLevel } = require(__dirname+'/../../../configs/main.js')
	, hashIp = require(__dirname+'/../../../helpers/haship.js')
	, decodeQueryIP = require(__dirname+'/../../../helpers/decodequeryip.js')
	, pageQueryConverter = require(__dirname+'/../../../helpers/pagequeryconverter.js')
	, limit = 20;

module.exports = async (req, res, next) => {

	const { page, offset, queryString } = pageQueryConverter(req.query, limit);
	let ip = decodeQueryIP(req.query, res.locals.permLevel);

	const postId = typeof req.query.postid === 'string' ? req.query.postid : null;
	if (postId && parseInt(postId)) {
		const fetchedPost = await Posts.getPost(req.params.board, +postId, true);
		if (fetchedPost) {
			ip = fetchedPost.ip.single;
		}
	}

	let posts;
	try {
		posts = await Posts.getBoardRecent(offset, limit, ip, req.params.board);
	} catch (err) {
		return next(err)
	}
    if (ipHashPermLevel !== -1
		&& res.locals.permLevel > ipHashPermLevel) {
        for (let i = 0; i < posts.length; i++) {
            posts[i].ip.single = hashIp(posts[i].ip.single);
        }
    }

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('managerecent', {
		csrf: req.csrfToken(),
		posts,
		page,
		postId,
		queryString,
	});

}
