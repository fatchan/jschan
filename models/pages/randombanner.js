'use strict';

const Boards = require(__dirname+'/../../db/boards.js');

module.exports = async (req, res, next) => {

	if (!req.query.board || typeof req.query.board !== 'string') {
		return next();
	}

	let banner;
	try {
		banner = await Boards.randomBanner(req.query.board);
	} catch (err) {
		return next(err);
	}

	if (!banner) {
		//non existing boards will show default banner, but it doesnt really matter.
		return res.redirect('/file/defaultbanner.png');
	}

	return res.redirect(`/banner/${req.query.board}/${banner}`);

};
