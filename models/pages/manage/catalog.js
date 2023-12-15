'use strict';

const Posts = require(__dirname+'/../../../db/posts.js');

module.exports = async (req, res, next) => {

	let threads;
	try {
		threads = await Posts.getCatalog(req.params.board);
	} catch (err) {
		return next(err);
	}

	res
		//.set('Cache-Control', 'private, max-age=5')
		.render('catalog', {
			modview: true,
			threads,
			board: res.locals.board,
			csrf: req.csrfToken(),
		});

};
