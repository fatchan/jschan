'use strict';

const { Posts } = require(__dirname+'/../../../db/')
	, { ipHashPermLevel } = require(__dirname+'/../../../configs/main.js')
	, pageQueryConverter = require(__dirname+'/../../../helpers/pagequeryconverter.js')
	, decodeQueryIP = require(__dirname+'/../../../helpers/decodequeryip.js')
	, hashIp = require(__dirname+'/../../../helpers/haship.js')
	, limit = 20;

module.exports = async (req, res, next) => {

	const { page, offset, queryString } = pageQueryConverter(req.query, limit);
	let ipMatch = null;//decodeQueryIP(req.query, res.locals.permLevel);
//todo: check if, and fetch post by post number, then get IP from post and search to not expose IP to hashed ip user

	let posts;
	try {
		posts = await Posts.getBoardRecent(offset, limit, ipMatch, req.params.board);
	} catch (err) {
		return next(err)
	}
    if (res.locals.permLevel > ipHashPermLevel) {
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
		ip: ipMatch ? req.query.ip : null,
		queryString,
	});

}
