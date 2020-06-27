'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
	, cache = require(__dirname+'/../../redis.js')
	, { overboardLimit } = require(__dirname+'/../../configs/main.js');

module.exports = async (req, res, next) => {

	let threads = [];
    try {
		threads = await Posts.getRecent(null, 1, overboardLimit, false);
    } catch (err) {
        return next(err);
    }

	res
	.set('Cache-Control', 'public, max-age=60')
	.render('overboard', {
		modview: true,
		threads,
	});

}
