'use strict';

const uuidv4 = require('uuid/v4')
    , path = require('path')
    , Posts = require(__dirname+'/../../db-models/posts.js')

module.exports = async (req, res, numFiles) => {

	// get the post that we are trying to edit
	let post;
	try {
		post = await Posts.getPost(req.params.board, req.body.id, true);
	} catch (err) {
		console.error(err);
		return res.status(500).render('error');
	}
	if (!thread || thread.thread != null) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'message': 'Post does not exist.',
			'redirect': redirect
		});
	}

	// sticky, lock, sage, spoiler, etc
	for (let i = 0; i < req.body.actions.length; i++) {
		//TODO
	}

	const post = await Posts.updateOne(req.params.board, data)
	const successRedirect = `/${req.params.board}/thread/${req.body.thread || post.insertedId}`;

	return res.redirect(successRedirect);
}
