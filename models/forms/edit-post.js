'use strict';

const uuidv4 = require('uuid/v4')
	, path = require('path')
	, Posts = require(__dirname+'/../../db-models/posts.js')

module.exports = async (req, res, next, numFiles) => {

	// get the post that we are trying to edit
	let post;
	try {
		post = await Posts.getPost(req.params.board, req.body.id, true);
	} catch (err) {
		return next(err);
	}

	if (!thread || thread.thread != null) {
		throw {
			'status': 400,
			'message': {
				'title': 'Bad request',
				'message': 'Post does not exist.',
				'redirect': redirect
			}
		};
	}

	// sticky, lock, sage, spoiler, etc
	for (let i = 0; i < req.body.actions.length; i++) {
		//TODO
	}

	return ``;

}
