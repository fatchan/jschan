'use strict';

const { News } = require(__dirname+'/../../db/')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, buildQueue = require(__dirname+'/../../queue.js')
	, linkQuotes = require(__dirname+'/../../helpers/posting/quotes.js')
	, { markdown } = require(__dirname+'/../../helpers/posting/markdown.js')
	, escape = require(__dirname+'/../../helpers/posting/escape.js')
	, sanitizeOptions = require(__dirname+'/../../helpers/posting/sanitizeoptions.js')
	, sanitize = require('sanitize-html');

module.exports = async (req, res, next) => {

	const escaped = escape(req.body.message);
	const styled = markdown(escaped);
	const quoted = (await linkQuotes(null, styled, null)).quotedMessage;
	const sanitized = sanitize(quoted, sanitizeOptions.after);

	const post = {
		'title': req.body.title,
		'message': {
			'raw': req.body.message,
			'markdown': sanitized
		},
		'date': new Date(),
	};

	await News.insertOne(post);

	buildQueue.push({
		'task': 'buildNews',
		'options': {}
	});

	return res.render('message', {
		'title': 'Success',
		'message': 'Added newspost',
		'redirect': '/globalmanage/news.html'
	});

}
