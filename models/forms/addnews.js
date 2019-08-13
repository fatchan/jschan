'use strict';

const News = require(__dirname+'/../../db/news.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, { buildNews } = require(__dirname+'/../../helpers/build.js')
	, linkQuotes = require(__dirname+'/../../helpers/posting/quotes.js')
	, simpleMarkdown = require(__dirname+'/../../helpers/posting/markdown.js')
	, escape = require(__dirname+'/../../helpers/posting/escape.js')
	, sanitizeOptions = require(__dirname+'/../../helpers/posting/sanitizeoptions.js')
	, sanitize = require('sanitize-html');

module.exports = async (req, res, next) => {

	const escaped = escape(req.body.message);
	const styled = simpleMarkdown(escaped);
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

	await buildNews();

	return res.render('message', {
		'title': 'Success',
		'message': 'Added newspost',
		'redirect': '/globalmanage.html'
	});

}
