'use strict';

const Posts = require(__dirname+'/../db-models/posts.js')
	, quoteRegex = /^>>\d+/gm
	, greentextRegex = /^>[^>].+/gm
	, redtextRegex = /^<[^<].+/gm
	, boldRegex = /==.+==/gm
	, italicRegex = /__.+__/gm
	, linkRegex = /https?\:\/\/[^\s]+/g
	, spoilerRegex = /\|.+\|/gm;

module.exports = (board, thread, text) => {

	//redtext
	text = text.replace(redtextRegex, (match) => {
		const red = match.substring(1);
		return `<span class='redtext'>&lt;${red}</span>`;
	});

	//greentext
	text = text.replace(greentextRegex, (match) => {
		const green = match.substring(1);
		return `<span class='greentext'>&gt;${green}</span>`;
	});

	//links
	text = text.replace(linkRegex, (match) => {
		return `<a href="${match}">${match}</a>`;
	});

	//quotes
	text = text.replace(quoteRegex, (match) => {
		const quotenum = match.substring(2);
		return `<a class='quote' href='/${board}/thread/${thread}#${quotenum}'>&gt;&gt;${quotenum}</a>`;
	});

	//bold
	text = text.replace(boldRegex, (match) => {
		const bold = match.substring(2, match.length-2);
		return `<strong>${bold}</strong>`;
	});

	//italic
	text = text.replace(italicRegex, (match) => {
		const italic = match.substring(2, match.length-2);
		return `<em>${italic}</em>`;
	});

	//spoilers
	text = text.replace(spoilerRegex, (match) => {
		const spoiler = match.substring(1, match.length-1);
		return `<span class='spoiler'>${spoiler}</span>`;
	});

	return text;

}
