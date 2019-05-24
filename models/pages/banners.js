'use strict';

const Boards = require(__dirname+'/../../db/boards.js');

module.exports = async (req, res, next) => {

	if (!req.query.board) {
		return next();
	}

	// get all threads
    let board;
    try {
        board = await Boards.findOne(req.query.board);
    } catch (err) {
        return next(err);
    }

	if (!board) {
		return next();
	}

	if (board.banners.length > 0) {
		const randomBanner = board.banners[Math.floor(Math.random()*board.banners.length)];
		return res.redirect(`/banner/${randomBanner}`);
	}

	return res.redirect('/img/defaultbanner.png');

}
