'use strict';

const Posts = require(__dirname+'/../../../db/posts.js');

module.exports = async (req, res, next) => {

	let thread;
	try {
		thread = await Posts.getThread(res.locals.board._id, res.locals.thread.postId, true);
		if (!thread) {
			return next(); //deleted between exists
		}
	} catch (err) {
		return next(err);
	}

	res
		.set('Cache-Control', 'private, max-age=5')
		.render('thread', {
			modview: true,
			upLevel: true,
			board: res.locals.board,
			thread,
			csrf: req.csrfToken(),
		});

};
