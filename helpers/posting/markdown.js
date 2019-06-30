'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
	, greentextRegex = /^>([^>].+)/gm
	, pinktextRegex = /^<([^<].+)/gm
	, boldRegex = /""(.+)""/gm
	, titleRegex = /==(.+)==/gm
	, underlineRegex = /__(.+)__/gm
	, strikethroughRegex = /~~(.+)~~/gm
	, italicRegex = /\*\*(.+)\*\*/gm
	, linkRegex = /https?\:\/\/[^\s<>\[\]{}|\\^]+/g
	, spoilerRegex = /\|\|(.+)\|\|/gm
	, detectedRegex = /(\(\(\(.+\)\)\))/gm
	, codeRegex = /^```\s([\s\S]+)\s```/gm;

module.exports = (text) => {

	//pinktext
	text = text.replace(pinktextRegex, (match, pinktext) => {
		return `<span class='pinktext'>&lt;${pinktext}</span>`;
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

	//bold
	text = text.replace(boldRegex, (match, bold) => {
		return `<strong>${bold}</strong>`;
	});

	//underline
	text = text.replace(underlineRegex, (match, underline) => {
		return `<span class='underline'>${underline}</span>`;
	});

	//strikethrough
	text = text.replace(strikethroughRegex, (match, strike) => {
		return `<span class='strikethrough'>${strike}</span>`;
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

	//code
	text = text.replace(codeRegex, (match, code) => {
        return `<span class='code'>${code.trim()}</span>`;
    });

	//detected
	text = text.replace(detectedRegex, (match, detected) => {
        return `<span class='detected'>${detected}</span>`;
    });

	return text;

}
