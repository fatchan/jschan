'use strict';

const greentextRegex = /^&gt;((?!&gt;\d+|&gt;&gt;&#x2F;\w+(&#x2F;\d*)?|&gt;&gt;#&#x2F;).*)/gm
	, pinktextRegex = /^&lt;(.+)/gm
	, boldRegex = /&#39;&#39;(.+?)&#39;&#39;/gm
	, titleRegex = /&#x3D;&#x3D;(.+?)&#x3D;&#x3D;/gm
	, monoRegex = /&#x60;(.+?)&#x60;/gm
	, underlineRegex = /__(.+?)__/gm
	, strikeRegex = /~~(.+?)~~/gm
	, italicRegex = /\*\*(.+?)\*\*/gm
	, spoilerRegex = /\|\|([\s\S]+?)\|\|/gm
	, detectedRegex = /(\(\(\(.+?\)\)\))/gm
	, linkRegex = /(https?\:&#x2F;&#x2F;[^\s<>\[\]{}|\\^]+/g
	, aLinkRegex = /\[([^\[][^\]]*?)\]\((https?\:&#x2F;&#x2F;[^\s<>\[\]{}|\\^)]+)\)|(https?\:&#x2F;&#x2F;[^\s<>\[\]{}|\\^]+)/g
	, codeRegex = /(?:(?<language>[a-z+]{1,10})\r?\n)?(?<code>[\s\S]+)/i
	, includeSplitRegex = /(\[code\][\s\S]+?\[\/code\])/gm
	, splitRegex = /\[code\]([\s\S]+?)\[\/code\]/gm
	, trimNewlineRegex = /^\s*(\r?\n)*|(\r?\n)*$/g
	, escape = require(__dirname+'/escape.js')
	, { highlight, highlightAuto } = require('highlight.js')
	, config = require(__dirname+'/../../config.js')
	, diceroll = require(__dirname+'/diceroll.js')
	, linkmatch = require(__dirname+'/linkmatch.js')
	, replacements = [
		{ regex: pinktextRegex, cb: (match, pinktext) => `<span class='pinktext'>&lt;${pinktext}</span>` },
		{ regex: greentextRegex, cb: (match, greentext) => `<span class='greentext'>&gt;${greentext}</span>` },
		{ regex: boldRegex, cb: (match, bold) => `<span class='bold'>${bold}</span>` },
		{ regex: underlineRegex, cb: (match, underline) => `<span class='underline'>${underline}</span>` },
		{ regex: strikeRegex, cb: (match, strike) => `<span class='strike'>${strike}</span>` },
		{ regex: titleRegex, cb: (match, title) => `<span class='title'>${title}</span>` },
		{ regex: italicRegex, cb: (match, italic) => `<span class='em'>${italic}</span>` },
		{ regex: spoilerRegex, cb: (match, spoiler) => `<span class='spoiler'>${spoiler}</span>` },
		{ regex: monoRegex, cb: (match, mono) => `<span class='mono'>${mono}</span>` },
		{ regex: linkRegex, aRegex: aLinkRegex, cb: linkmatch },
		{ regex: detectedRegex, cb: (match, detected) => `<span class='detected'>${detected}</span>` },
		{ regex: diceroll.regexMarkdown, cb: diceroll.markdown },
	];

module.exports = {

	prepareMarkdown: (text, force) => {
		if (!text || text.length === 0) {
			return text;
		}
		const chunks = text.split(includeSplitRegex);
		for (let i = 0; i < chunks.length; i++) {
			//every other chunk will be a code block
			if (i % 2 === 0) {
				chunks[i] = chunks[i].replace(
					diceroll.regexPrepare, diceroll.prepare(force));
			}
		}
		return chunks.join('');
	},

	markdown: (text, allowAdvanced=false) => {
		const chunks = text.split(splitRegex);
		const { highlightOptions } = config.get;
		for (let i = 0; i < chunks.length; i++) {
			//every other chunk will be a code block
			if (i % 2 === 0) {
				const escaped = escape(chunks[i]);
				const newlineFix = escaped.replace(/^\r?\n/,''); //fix ending newline because of codeblock
				chunks[i] = module.exports.processRegularChunk(newlineFix, allowAdvanced);
			} else {
				chunks[i] = module.exports.processCodeChunk(chunks[i], highlightOptions);
			}
		}
		return chunks.join('');
	},

	processCodeChunk: (text, highlightOptions) => {
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
			const { value } = highlight(lang, trimFix, true);
			return `<span class='code hljs'><small>language: ${lang}</small>\n${value}</span>`;
		} else if (lang === 'aa') {
			return `<span class='aa'>${escape(matches.groups.code)}</span>`;
		}
		return `<span class='code'>${escape(trimFix)}</span>`;
	},

	processRegularChunk: (text, allowAdvanced) => {
		for (let i = 0; i < replacements.length; i++) {
			//if allowAdvanced is true, use aRegex if available
			const replaceRegex = allowAdvanced === true && replacements[i].aRegex || replacements[i].regex;
			text = text.replace(replaceRegex, replacements[i].cb);
		}
		return text;
	},

}
