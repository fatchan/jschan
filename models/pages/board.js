'use strict';

const Posts = require(__dirname+'/../../db/posts.js')l

module.exports = async (req, res, next) => {

	const page = req.params.page === 'index' ? 1 : (req.params.page || 1);
	let threads;
	let pages;
	try {
		pages = Math.ceil((await Posts.getPages(req.params.board)) / 10)
		if (page > pages && pages > 0) {
			return next();
		}
		threads = await Posts.getRecent(req.params.board, page);
	} catch (err) {
		return next(err);
	}

	return res.render('board', {
		threads: threads || [],
		pages,
		page,
	});

}
