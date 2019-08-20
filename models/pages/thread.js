'use strict';

const { buildThread } = require(__dirname+'/../../helpers/build.js');

module.exports = async (req, res, next) => {

	let html;
    try {
		html = await buildThread(res.locals.thread.postId, res.locals.board);
    } catch (err) {
        return next(err);
	}

	return res.send(html);

}
