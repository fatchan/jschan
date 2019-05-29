'use strict';

const Boards = require(__dirname+'/../../db/boards.js');

module.exports = async (req, res, next) => {

	if (!req.query.board) {
		return next();
	}

	//agregate to get single random item from banners array
	const board = await Boards.db.aggregate([
		{
			'$unwind': '$banners'
		},
		{
			'$sample': {
				'size' : 1
			}
		}
	]).toArray().then(res => res[0]);

	if (board && board.banners != null) {
		return res.redirect(`/banner/${req.query.board}/${board.banners}`);
	}

	return res.redirect('/img/defaultbanner.png');

}
