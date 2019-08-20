'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
	, { buildBoard } = require(__dirname+'/../../helpers/build.js');

module.exports = async (req, res, next) => {

	const page = req.params.page === 'index' ? 1 : req.params.page;
	let html;
	try {
		const maxPage = Math.min(Math.ceil((await Posts.getPages(req.params.board)) / 10), Math.ceil(res.locals.board.settings.threadLimit/10)) || 1;
		if (page > maxPage) {
			return next();
		}
		html = await buildBoard(res.locals.board, page, maxPage);
	} catch (err) {
		return next(err);
	}

	return res.send(html);

}
