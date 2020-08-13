'use strict';

const { News } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, buildQueue = require(__dirname+'/../../queue.js')
	, messageHandler = require(__dirname+'/../../helpers/posting/message.js');

module.exports = async (req, res, next) => {

	const { message: markdownNews } = await messageHandler(req.body.message, null, null);

	const post = {
		'title': req.body.title,
		'message': {
			'raw': req.body.message,
			'markdown': markdownNews
		},
		'date': new Date(),
	};

	await News.insertOne(post);

	buildQueue.push({
		'task': 'buildNews',
		'options': {}
	});

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Added newspost',
		'redirect': '/globalmanage/news.html'
	});

}
