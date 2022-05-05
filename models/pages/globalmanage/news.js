'use strict';

const { News } = require(__dirname+'/../../../db/');

module.exports = async (req, res, next) => {

	let news;
	try {
		news = await News.find();
	} catch (err) {
		return next(err);
	}

	res
		.set('Cache-Control', 'private, max-age=5')
		.render('globalmanagenews', {
			csrf: req.csrfToken(),
			permissions: res.locals.permissions,
			news,
		});

};
