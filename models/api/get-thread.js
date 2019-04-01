'use strict';

const Posts = require(__dirname+'/../../db-models/posts.js');

module.exports = async (req, res) => {
	//get the recently bumped thread & preview posts
	let thread;
	try {
		thread = await Posts.getThread(req.params.board, req.params.id);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ 'message': 'Error fetching from DB' });
	}

	if (!thread) {
		return res.status(404).json({ 'message': 'Not found' });
	}

	return res.json(thread)
}
