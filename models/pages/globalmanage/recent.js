'use strict';

const { Posts } = require(__dirname+'/../../../db/');

module.exports = async (req, res, next) => {

	let posts;
	try {
		posts = await Posts.getGlobalRecent(); //10 default limit can be adjusted
	} catch (err) {
		return next(err)
	}

	res.render('globalmanagerecent', {
		csrf: req.csrfToken(),
		posts,
	});

}
