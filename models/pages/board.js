'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
	, { buildBoard } = require(__dirname+'/../../lib/build/tasks.js');

module.exports = async (req, res, next) => {

	const page = req.params.page === 'index' ? 1 : Number(req.params.page);
	let html, json;
	try {
		const maxPage = Math.min(Math.ceil((await Posts.getPages(req.params.board)) / 10), Math.ceil(res.locals.board.settings.threadLimit/10)) || 1;
		if (page > maxPage) {
			return next();
		}
		({ html, json } = await buildBoard({
			board: res.locals.board,
			page,
			maxPage
		}));
	} catch (err) {
		return next(err);
	}

	if (req.path.endsWith('.json')) {
		return res.set('Cache-Control', 'max-age=0').json(json);
	} else {
		return res.set('Cache-Control', 'max-age=0').send(html);
	}

};
