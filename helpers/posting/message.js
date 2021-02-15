'use strict';

const quoteHandler = require(__dirname+'/quotes.js')
	, { markdown } = require(__dirname+'/markdown.js')
	, sanitizeOptions = require(__dirname+'/sanitizeoptions.js')
	, sanitize = require('sanitize-html');

module.exports = async (inputMessage, boardName, threadId=null, allowAdvanced=false) => {

	let message = inputMessage;
	let quotes = [];
	let crossquotes = [];

	//markdown a post, link the quotes, sanitize and return message and quote arrays
	if (message && message.length > 0) {
		message = markdown(message, allowAdvanced);
		const { quotedMessage, threadQuotes, crossQuotes } = await quoteHandler.process(boardName, message, threadId);
		message = quotedMessage;
		quotes = threadQuotes;
		crossquotes = crossQuotes;
		message = sanitize(message, sanitizeOptions.after);
	}

	return { message, quotes, crossquotes };

}
