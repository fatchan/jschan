'use strict';

const { buildThread } = require(__dirname+'/../../helpers/tasks.js');

module.exports = async (req, res, next) => {

	let html, json;
	try {
		({ html, json } = await buildThread({
			threadId: res.locals.thread.postId,
			board: res.locals.board
		}));
	} catch (err) {
		return next(err);
	}

	if (req.path.endsWith('.json')) {
		return res.json(json);
	} else {
		return res.send(html);
	}

}
