'use strict';

const Posts = require(__dirname+'/../../db-models/posts.js');

module.exports = async (req, res) => {
	//get the recently bumped thread & preview posts
	let threads;
	try {
		threads = await Posts.getRecent(req.params.board, req.params.page);
	} catch (err) {
		return next(err);
	}

	//render the page
	res.render('board', {
		csrf: req.csrfToken(),
		threads: threads || []
	});
}
