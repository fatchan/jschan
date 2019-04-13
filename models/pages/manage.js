'use strict';

const Posts = require(__dirname+'/../../db-models/posts.js')
	, Bans = require(__dirname+'/../../db-models/bans.js');

module.exports = async (req, res, next) => {

	let posts;
	let bans;
	try {
		posts = await Posts.getReports(req.params.board);
		bans = await Bans.getBoardBans(req.params.board);
	} catch (err) {
		return next(err)
	}

	//render the page
	res.render('manage', {
		csrf: req.csrfToken(),
		posts: posts,
		bans: bans || [],
	});

}
