'use strict';

const { News } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, buildQueue = require(__dirname+'/../../lib/build/queue.js')
	, { prepareMarkdown } = require(__dirname+'/../../lib/post/markdown/markdown.js')
	, messageHandler = require(__dirname+'/../../lib/post/message.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;
	const message = prepareMarkdown(req.body.message, false);
	const { message: markdownNews } = await messageHandler(message, null, null, res.locals.permissions);

	const updated = await News.updateOne(req.body.news_id, req.body.title, message, markdownNews).then(r => r.matchedCount);

	if (updated === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': __('Bad request'),
			'errors': __('News post does not exist'),
			'redirect': req.headers.referer || '/globalmanage/news.html'
		});
	}

	buildQueue.push({
		'task': 'buildNews',
		'options': {}
	});

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Updated newspost'),
		'redirect': '/globalmanage/news.html'
	});

};
