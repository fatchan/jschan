'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, writePageHTML = require(__dirname+'/../../helpers/writepagehtml.js');

module.exports = async (req, res, next) => {

	const page = req.params.page === 'index' ? 1 : (req.params.page || 1);
	let threads;
	let pages;
	let pageURL;
	try {
		pages = Math.ceil((await Posts.getPages(req.params.board)) / 10)
		if (page > pages && pages > 0) {
			return next();
		}
		threads = await Posts.getRecent(req.params.board, page);
		pageURL = `${req.params.board}/${req.params.page}.html`;
		await writePageHTML(pageURL, 'board.pug', {
			board: res.locals.board,
			threads: threads || [],
			pages,
			page
		});
	} catch (err) {
		return next(err);
	}

	return res.sendFile(`${uploadDirectory}html/${pageURL}`);

}
