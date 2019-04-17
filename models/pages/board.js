'use strict';

const Posts = require(__dirname+'/../../db/posts.js');

module.exports = async (req, res, next) => {
	//get the recently bumped thread & preview posts
	const page = req.query.p || 1;
	let threads;
	let pages;
	try {
		pages = Math.ceil((await Posts.getPages(req.params.board)) / 10) || 1;
		if (page > pages) {
			return next();
		}
		threads = await Posts.getRecent(req.params.board, page);
	} catch (err) {
		return next(err);
	}

	//render the page
	res.render('board', {
		csrf: req.csrfToken(),
		threads: threads || [],
		pages,
		page,
	});
}
