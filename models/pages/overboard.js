'use strict';

const { Posts, Boards } = require(__dirname+'/../../db/')
	, cache = require(__dirname+'/../../redis.js')
	, { overboardLimit } = require(__dirname+'/../../configs/main.js');

module.exports = async (req, res, next) => {

	let threads = [];
    try {
		const listedBoards = await Boards.getLocalListed();
		threads = await Posts.getRecent(listedBoards, 1, overboardLimit, false, false);
    } catch (err) {
        return next(err);
    }

	res
	.set('Cache-Control', 'public, max-age=60')
	.render('overboard', {
		threads,
	});

}
