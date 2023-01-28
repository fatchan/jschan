'use strict';

const { CustomPages } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, buildQueue = require(__dirname+'/../../lib/build/queue.js')
	, { prepareMarkdown } = require(__dirname+'/../../lib/post/markdown/markdown.js')
	, messageHandler = require(__dirname+'/../../lib/post/message.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;
	const message = prepareMarkdown(req.body.message, false);
	const { message: markdownMessage } = await messageHandler(message, null, null, res.locals.permissions);

	const post = {
		'board': req.params.board,
		'page': req.body.page,
		'title': req.body.title,
		'message': {
			'raw': message,
			'markdown': markdownMessage
		},
		'date': new Date(),
		'edited': null,
	};

	const insertedCustomPage = await CustomPages.insertOne(post);
	post._id = insertedCustomPage.insertedId;

	buildQueue.push({
		'task': 'buildCustomPage',
		'options': {
			'board': res.locals.board,
			'page': post.page,
			'customPage': post,
		}
	});

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Added custom page'),
		'redirect': `/${req.params.board}/manage/custompages.html`
	});

};
