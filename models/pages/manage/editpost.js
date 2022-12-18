'use strict';

module.exports = async (req, res) => {

	return res
		.set('Cache-Control', 'private, max-age=5')
		.render('editpost', {
			'csrf': req.csrfToken(),
			'post': res.locals.post,
			'board': res.locals.board,
			'referer': (req.headers.referer || `/${res.locals.post.board}/manage/thread/${res.locals.post.thread || res.locals.post.postId}.html`) + `#${res.locals.post.postId}`,
		});

};
