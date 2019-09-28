'use strict';

const greentextRegex = /^&gt;((?!&gt;).+)/gm
	, pinktextRegex = /^&lt;(.+)/gm
	, boldRegex = /&#39;&#39;(.+?)&#39;&#39;/gm
	, titleRegex = /&#x3D;&#x3D;(.+?)&#x3D;&#x3D;/gm
	, monoRegex = /&#x60;(.+?)&#x60;/gm
	, underlineRegex = /__(.+?)__/gm
	, strikethroughRegex = /~~(.+?)~~/gm
	, italicRegex = /\*\*(.+?)\*\*/gm
	, spoilerRegex = /\|\|([\s\S]+?)\|\|/gm
	, detectedRegex = /(\(\(\(.+?\)\)\))/gm
	, linkRegex = /https?\:&#x2F;&#x2F;[^\s<>\[\]{}|\\^]+/g
	, codeRegex = /&#x60;&#x60;&#x60;([\s\S]+?)&#x60;&#x60;&#x60;/gm
	, diceRegex = /##(?<numdice>\d+)d(?<numsides>\d+)(?:(?<operator>[+-])(?<modifier>\d+))?/gmi
	, diceRoll = require(__dirname+'/diceroll.js');

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
		return `<a rel='nofollow' referrerpolicy='same-origin' target='_blank' href='${match}'>${match}</a>`;
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
		const trimFix = code.replace(/^\s*\n/, ''); //remove extra whitespace/newline at start
        return `<span class='code'>${trimFix}</span>`;
    });

	//inline monospace
	text = text.replace(monoRegex, (match, mono) => {
        return `<span class='mono'>${mono}</span>`;
    });

	//detected
	text = text.replace(detectedRegex, (match, detected) => {
        return `<span class='detected'>${detected}</span>`;
    });

	//dice rolls
	text = text.replace(diceRegex, diceRoll);

	return text;

}
