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
	, codeRegex = /```([\s\S]+?)```/gm
	, diceRegex = /##(?<numdice>\d+)d(?<numsides>\d+)(?:(?<operator>[+-])(?<modifier>\d+))?/gmi
	, getDomain = (string) => string.split(/\/\/|\//)[1] //unused atm
	, diceRoll = require(__dirname+'/diceroll.js')
	, escape = require(__dirname+'/escape.js')
	, { highlightAuto } = require('highlight.js');

module.exports = {

	markdown: (text) => {
		const chunks = text.split(codeRegex);
		for (let i = 0; i < chunks.length; i++) {
			//every other chunk will be a code block
			if (i % 2 === 0) {
				const escaped = escape(chunks[i]);
				const newlineFix = escaped.replace(/^\r?\n/,''); //fix ending newline because of codeblock
				chunks[i] = module.exports.processRegularChunk(newlineFix);
			} else {
				chunks[i] = module.exports.processCodeChunk(chunks[i]);
			}
		}
		return chunks.join('');
	},

	processCodeChunk: (text) => {
		const trimFix = text.replace(/^\s*(\r?\n)*|(\r?\n)*$/g, ''); //remove extra whitespace/newlines at ends
		const { language, relevance, value } = highlightAuto(trimFix);
		return `<span class='code'>${value}\n<small>language: ${language}, confidence: ${relevance}</small></span>`;
	},

	processRegularChunk: (text) => {

		//pinktext 
		text = text.replace(pinktextRegex, (match, pinktext) => {
			return `<span class='pinktext'>&lt;${pinktext}</span>`;
		});

		//greentext
		text = text.replace(greentextRegex, (match, greentext) => {
			return `<span class='greentext'>&gt;${greentext}</span>`;
		});

		//bold
		text = text.replace(boldRegex, (match, bold) => {
			return `<span class='bold'>${bold}</span>`;
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
			return `<span class='em'>${italic}</span>`;
		});

		//spoilers
		text = text.replace(spoilerRegex, (match, spoiler) => {
			return `<span class='spoiler'>${spoiler}</span>`;
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

		//links
		text = text.replace(linkRegex, (match) => {
			return `<a rel='nofollow' referrerpolicy='same-origin' target='_blank' href='${match}'>${match}</a>`;
		});

		return text;

	}

}
