'use strict';

const Posts = require(__dirname+'/../db/posts.js')
	, greentextRegex = /^>([^>].+)/gm
	, redtextRegex = /^<([^<].+)/gm
	, boldRegex = /""(.+)""/gm
	, titleRegex = /==(.+)==/gm
	, italicRegex = /__(.+)__/gm
	, linkRegex = /https?\:\/\/[^\s]+/g
	, spoilerRegex = /\|\|(.+)\|\|/gm
	, codeRegex = /^```\s([\s\S]+)\s```/gm;

module.exports = (board, thread, text) => {

	//redtext
	text = text.replace(redtextRegex, (match, redtext) => {
		return `<span class='redtext'>&lt;${redtext}</span>`;
	});

	//greentext
	text = text.replace(greentextRegex, (match, greentext) => {
		return `<span class='greentext'>&gt;${greentext}</span>`;
	});

	//links
	text = text.replace(linkRegex, (match) => {
		return `<a href="${match}">${match}</a>`;
	});

	//bold
	text = text.replace(boldRegex, (match, bold) => {
		return `<strong>${bold}</strong>`;
	});

	//titles
	text = text.replace(titleRegex, (match, title) => {
		return `<span class='title'>${title}</span>`;
	});

	//italic
	text = text.replace(italicRegex, (match, italic) => {
		return `<em>${italic}</em>`;
	});

	//spoilers
	text = text.replace(spoilerRegex, (match, spoiler) => {
		return `<span class='spoiler'>${spoiler}</span>`;
	});

	text = text.replace(codeRegex, (match, code) => {
        return `<span class='code'>${code.trim()}</span>`;
    });

	return text;

}
