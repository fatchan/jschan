'use strict';

const Posts = require(__dirname+'/../../../db/posts.js');

module.exports = async (req, res, next) => {

	let reports;
	try {
		reports = await Posts.getReports(req.params.board);
	} catch (err) {
		return next(err)
	}

	res.render('managereports', {
		csrf: req.csrfToken(),
		reports,
	});

}
