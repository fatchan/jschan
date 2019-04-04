'use strict';

const Posts = require(__dirname+'/../../db-models/posts.js');

module.exports = async (req, res) => {

	let posts;
	try {
		posts = await Posts.getReports(req.params.board);
	} catch (err) {
		console.error(err);
		return res.status(500).render('error');
	}

	//render the page
	res.render('manage', {
		csrf: req.csrfToken(),
		posts: posts
	});

}
