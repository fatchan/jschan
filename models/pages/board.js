'use strict';

const Posts = require(__dirname+'/../../db-models/posts.js');

module.exports = async (req, res, next) => {
	//get the recently bumped thread & preview posts
	let threads;
	let pages;
	try {
		threads = await Posts.getRecent(req.params.board, req.params.page || 1);
		pages = Math.ceil((await Posts.getPages(req.params.board)) / 10);
	} catch (err) {
		return next(err);
	}

	//render the page
	res.render('board', {
		csrf: req.csrfToken(),
		threads: threads || [],
		pages: pages
	});
}
