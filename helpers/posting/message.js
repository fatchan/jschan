'use strict';

const linkQuotes = require(__dirname+'/quotes.js')
	, { markdown } = require(__dirname+'/markdown.js')
	, sanitizeOptions = require(__dirname+'/sanitizeoptions.js')
	, sanitize = require('sanitize-html');

module.exports = async (inputMessage, boardName, threadId=null) => {

	let message = inputMessage;
	let quotes = [];
	let crossquotes = [];

	//markdown a post, link the quotes, sanitize and return message and quote arrays
	if (message && message.length > 0) {
		message = markdown(message);
		const { quotedMessage, threadQuotes, crossQuotes } = await linkQuotes(boardName, message, threadId);
		message = quotedMessage;
		quotes = threadQuotes;
		crossquotes = crossQuotes;
		message = sanitize(message, sanitizeOptions.after);
	}

	return { message, quotes, crossquotes };

}
