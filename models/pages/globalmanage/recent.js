'use strict';

const { Posts } = require(__dirname+'/../../../db/')
	, pageQueryConverter = require(__dirname+'/../../../helpers/pagequeryconverter.js')
	, limit = 20;

module.exports = async (req, res, next) => {

	const { page, offset } = pageQueryConverter(req.query, limit);

	let posts;
	try {
		posts = await Posts.getGlobalRecent(offset, limit);
	} catch (err) {
		return next(err)
	}

	res.render('globalmanagerecent', {
		csrf: req.csrfToken(),
		posts,
		page,
	});

}
