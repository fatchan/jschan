
'use strict';

const quoteHandler = require(__dirname+'/quotes.js')
	, { markdown } = require(__dirname+'/markdown.js')
	, sanitizeOptions = require(__dirname+'/sanitizeoptions.js')
	, Permission = require(__dirname+'/../permissions.js')
	, PermissionTemplates = require(__dirname+'/../permtemplates.js')
	, sanitize = require('sanitize-html');

module.exports = async (inputMessage, boardName, threadId=null, permissions=null) => {

	let message = inputMessage;
	let quotes = [];
	let crossquotes = [];

	if (permissions === null) {
		//technically there has for a long time been a bug here, but it can be fixed later. permissions unknown for old msgs
		permissions = new Permission(PermissionTemplates.ANON.base64);
	}

	//markdown a post, link the quotes, sanitize and return message and quote arrays
	if (message && message.length > 0) {
		message = markdown(message, permissions);
		const { quotedMessage, threadQuotes, crossQuotes } = await quoteHandler.process(boardName, message, threadId);
		message = quotedMessage;
		quotes = threadQuotes;
		crossquotes = crossQuotes;
		message = sanitize(message, sanitizeOptions.after);
	}

	return { message, quotes, crossquotes };

}
