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

	const post = {
		'title': req.body.title,
		'message': {
			'raw': message,
			'markdown': markdownNews
		},
		'date': new Date(),
		'edited': null,
	};

	await News.insertOne(post);

	buildQueue.push({
		'task': 'buildNews',
		'options': {}
	});

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Added newspost'),
		'redirect': '/globalmanage/news.html'
	});

};
