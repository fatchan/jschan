'use strict';

const { News } = require(__dirname+'/../../../db/');

module.exports = async (req, res, next) => {

	let news;
	try {
		news = await News.find();
	} catch (err) {
		return next(err)
	}

	res.render('globalmanagenews', {
		csrf: req.csrfToken(),
		news,
	});

}
