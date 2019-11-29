'use strict';

const greentextRegex = /^&gt;((?!&gt;).+)/gm
	, pinktextRegex = /^&lt;(.+)/gm
	, boldRegex = /&#39;&#39;(.+?)&#39;&#39;/gm
	, titleRegex = /&#x3D;&#x3D;(.+)&#x3D;&#x3D;/gm
	, monoRegex = /&#x60;(.+?)&#x60;/gm
	, underlineRegex = /__(.+?)__/gm
	, strikethroughRegex = /~~(.+?)~~/gm
	, italicRegex = /\*\*(.+?)\*\*/gm
	, spoilerRegex = /\|\|([\s\S]+?)\|\|/gm
	, detectedRegex = /(\(\(\(.+?\)\)\))/gm
	, linkRegex = /https?\:&#x2F;&#x2F;[^\s<>\[\]{}|\\^]+/g
	, codeRegex = /(?:(?<language>[a-z+]{1,10})\r?\n)?(?<code>[\s\S]+)/i
	, splitRegex = /```([\s\S]+?)```/gm
	, trimNewlineRegex = /^\s*(\r?\n)*|(\r?\n)*$/g
	, diceRegex = /##(?<numdice>\d+)d(?<numsides>\d+)(?:(?<operator>[+-])(?<modifier>\d+))?/gmi
	, getDomain = (string) => string.split(/\/\/|\//)[1] //unused atm
	, diceRoll = require(__dirname+'/diceroll.js')
	, escape = require(__dirname+'/escape.js')
	, { highlight, highlightAuto } = require('highlight.js')
	, { highlightOptions } = require(__dirname+'/../../configs/main.js');

module.exports = {

	markdown: (text) => {
		const chunks = text.split(splitRegex);
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
		const matches = text.match(codeRegex);
		const trimFix = matches.groups.code.replace(trimNewlineRegex, '');
		let lang;
		if (matches.groups.language && matches.groups.language.length > 0) {
			lang = matches.groups.language.toLowerCase();
		}
		if (!lang) {
			const { language, relevance, value } = highlightAuto(trimFix, highlightOptions.languageSubset);
			if (relevance > highlightOptions.threshold) {
				return `<span class='code hljs'><small>possible language: ${language}, relevance: ${relevance}</small>\n${value}</span>`;
			}
		} else if (lang !== 'plain' && highlightOptions.languageSubset.includes(lang)) {
			const { value } = highlight(lang, trimFix);
			return `<span class='code hljs'><small>language: ${lang}</small>\n${value}</span>`;
		}
		return `<span class='code'>${escape(trimFix)}</span>`;
	},

	processRegularChunk: (text) => {
		return text.replace(pinktextRegex, (match, pinktext) => {
			return `<span class='pinktext'>&lt;${pinktext}</span>`;
		}).replace(greentextRegex, (match, greentext) => {
			return `<span class='greentext'>&gt;${greentext}</span>`;
		}).replace(boldRegex, (match, bold) => {
			return `<span class='bold'>${bold}</span>`;
		}).replace(underlineRegex, (match, underline) => {
			return `<span class='underline'>${underline}</span>`;
		}).replace(strikethroughRegex, (match, strike) => {
			return `<span class='strikethrough'>${strike}</span>`;
		}).replace(titleRegex, (match, title) => {
			return `<span class='title'>${title}</span>`;
		}).replace(italicRegex, (match, italic) => {
			return `<span class='em'>${italic}</span>`;
		}).replace(spoilerRegex, (match, spoiler) => {
			return `<span class='spoiler'>${spoiler}</span>`;
		}).replace(monoRegex, (match, mono) => {
			return `<span class='mono'>${mono}</span>`;
		}).replace(detectedRegex, (match, detected) => {
			return `<span class='detected'>${detected}</span>`;
		}).replace(linkRegex, (match) => {
			return `<a rel='nofollow' referrerpolicy='same-origin' target='_blank' href='${match}'>${match}</a>`;
		}).replace(diceRegex, diceRoll);
	},

}
