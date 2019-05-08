'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, writePageHTML = require(__dirname+'/../../helpers/writepagehtml.js');

module.exports = async (req, res, next) => {

	//get the recently bumped thread & preview posts
	let thread;
	let threadURL;
	try {
		thread = await Posts.getThread(req.params.board, req.params.id);
		if (!thread) {
			return res.status(404).render('404');
		}
		threadURL = `${req.params.board}/thread/${req.params.id}.html`;
		await writePageHTML(threadURL, 'thread.pug', {
			board: res.locals.board,
			thread
		});
	} catch (err) {
		return next(err);
	}

	return res.sendFile(`${uploadDirectory}html/${threadURL}`);

}
