'use strict';

const Posts = require(__dirname+'/../../../db/posts.js');

module.exports = async (req, res, next) => {

	let reports;
	try {
		reports = await Posts.getReports(req.params.board, res.locals.permLevel);
	} catch (err) {
		return next(err)
	}

	res.set('Cache-Control', 'private, max-age=5');

	if (req.path.endsWith('/reports.json')) {
		res.json({
			reports,
		});
	} else {
		res.render('managereports', {
			csrf: req.csrfToken(),
			reports,
		});
	}

}
