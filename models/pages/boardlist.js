'use strict';

const cache = require(__dirname+'/../../redis.js')
	, { enableWebring } = require(__dirname+'/../../configs/main.json')
	, { Boards } = require(__dirname+'/../../db/')
	, limit = 20;

module.exports = async (req, res, next) => {

	let page;
	if (req.query.page && !isNaN(parseInt(req.query.page))) {
		page = parseInt(req.query.page) || 1; //or 1 prevent 0 page
	} else {
		page = 1;
	}
	const offset = (page-1) * limit;
	let boards, webringBoards, localPages, webringPages;
	try {
		[ boards, webringBoards, localPages ] = await Promise.all([
			Boards.boardSort(offset, limit),
			enableWebring ? cache.get('webring:boards') : null,
			Boards.count(),
		]);
	} catch (err) {
		return next(err);
	}
	localPages = Math.ceil(localPages / limit);
	if (enableWebring && webringBoards) { //sort webring boards
		webringPages = Math.ceil(webringBoards.length / limit);
		webringBoards = webringBoards.sort((a, b) => { return b.uniqueUsers - a.uniqueUsers }).splice(offset, limit);
	}
	const maxPage = Math.max(localPages, webringPages);
	return res.render('boardlist', {
		boards,
		webringBoards,
		page,
		maxPage
	});

}
