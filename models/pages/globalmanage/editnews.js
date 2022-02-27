'use strict';

const { News } = require(__dirname+'/../../../db/');

module.exports = async (req, res, next) => {

	let news;
	try {
		news = await News.findOne(req.params.newsid);
	} catch (err) {
		return next(err)
	}

	if (!news) {
		return next();
	}

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('editnews', {
		csrf: req.csrfToken(),
		permissions: res.locals.permissions,
		news,
	});

}
