'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
	, { buildBoard } = require(__dirname+'/../../build.js')
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js');

module.exports = async (req, res, next) => {

	const page = req.params.page === 'index' ? 1 : req.params.page;
	try {
		const maxPage = Math.ceil((await Posts.getPages(req.params.board)) / 10);
		if (page > maxPage && maxPage > 0) {
			return next();
		}
		await buildBoard(res.locals.board, page, maxPage);
	} catch (err) {
		return next(err);
	}

	return res.sendFile(`${uploadDirectory}html/${req.params.board}/${page === 1 ? 'index' : page}.html`);

}
