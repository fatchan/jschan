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

	const posts = await Posts.db.find({/*query here*/}).toArray();
	await Promise.all(posts.map(async (post) => {
		let message = markdown(post.nomarkup);
		const { quotedMessage, threadQuotes, crossQuotes } = await linkQuotes(post.board, message, null);
		message = sanitize(quotedMessage, sanitizeOptions.after);
		console.log(post.postId, message.substring(0,10)+'...');
		return Posts.db.updateOne({board:post.board, postId:post.postId}, {$set:{message:message}});
	}));

})();


