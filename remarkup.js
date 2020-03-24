'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const Mongo = require(__dirname+'/db/db.js');

(async () => {

	await Mongo.connect();
	const { Posts } = require(__dirname+'/db/')
		, linkQuotes = require(__dirname+'/helpers/posting/quotes.js')
		, { markdown } = require(__dirname+'/helpers/posting/markdown.js')
		, sanitizeOptions = require(__dirname+'/helpers/posting/sanitizeoptions.js')
		, sanitize = require('sanitize-html');

	const post = await Posts.db.findOne({/*post query here*/});
	let message = markdown(post.nomarkup);
	const { quotedMessage, threadQuotes, crossQuotes } = await linkQuotes('tech', message, null);
	message = sanitize(quotedMessage, sanitizeOptions.after);
	await Posts.db.updateOne({board:'tech', postId:357}, {$set:{message:message}});

})();


