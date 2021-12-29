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
	, detectedRegex = /\(\(\((.+?)\)\)\)/gm
	, linkRegex = /\[(?<label>[^\[][^\]]*?)\]\((?<url>(?:&#x2F;[^\s<>\[\]{}|\\^)]+|https?\:&#x2F;&#x2F;[^\s<>\[\]{}|\\^)]+))\)|(?<urlOnly>https?\:&#x2F;&#x2F;[^\s<>\[\]{}|\\^]+)/g
	, codeRegex = /(?:(?<language>[a-z+]{1,14})\r?\n)?(?<code>[\s\S]+)/i
	, includeSplitRegex = /(\[code\][\s\S]+?\[\/code\])/gm
	, splitRegex = /\[code\]([\s\S]+?)\[\/code\]/gm
	, trimNewlineRegex = /^(\s*\r?\n)*/g
	, escape = require(__dirname+'/escape.js')
	, { highlight, highlightAuto, listLanguages } = require('highlight.js')
	, validLanguages = listLanguages() //precompute
	, { addCallback } = require(__dirname+'/../../redis.js')
	, config = require(__dirname+'/../../config.js')
	, diceroll = require(__dirname+'/diceroll.js')
	, fortune = require(__dirname+'/fortune.js')
	, linkmatch = require(__dirname+'/linkmatch.js');

let replacements = []
	, markdownPermLevels;

const updateMarkdownPerms = () => {
	markdownPermLevels = config.get.permLevels.markdown;
	replacements = [
		{ permLevel: markdownPermLevels.pink, regex: pinktextRegex, cb: (permLevel, match, pinktext) => `<span class='pinktext'>&lt;${pinktext}</span>` },
		{ permLevel: markdownPermLevels.green, regex: greentextRegex, cb: (permLevel, match, greentext) => `<span class='greentext'>&gt;${greentext}</span>` },
		{ permLevel: markdownPermLevels.bold, regex: boldRegex, cb: (permLevel, match, bold) => `<span class='bold'>${bold}</span>` },
		{ permLevel: markdownPermLevels.underline, regex: underlineRegex, cb: (permLevel, match, underline) => `<span class='underline'>${underline}</span>` },
		{ permLevel: markdownPermLevels.strike, regex: strikeRegex, cb: (permLevel, match, strike) => `<span class='strike'>${strike}</span>` },
		{ permLevel: markdownPermLevels.title, regex: titleRegex, cb: (permLevel, match, title) => `<span class='title'>${title}</span>` },
		{ permLevel: markdownPermLevels.italic, regex: italicRegex, cb: (permLevel, match, italic) => `<span class='em'>${italic}</span>` },
		{ permLevel: markdownPermLevels.spoiler, regex: spoilerRegex, cb: (permLevel, match, spoiler) => `<span class='spoiler'>${spoiler}</span>` },
		{ permLevel: markdownPermLevels.mono, regex: monoRegex, cb: (permLevel, match, mono) => `<span class='mono'>${mono}</span>` },
		{ permLevel: markdownPermLevels.detected, regex: detectedRegex, cb: (permLevel, match, detected) => `<span class='detected'>&lpar;&lpar;&lpar; ${detected} &rpar;&rpar;&rpar;</span>` },
		{ permLevel: markdownPermLevels.link, regex: linkRegex, cb: linkmatch },
		{ permLevel: markdownPermLevels.dice, regex: diceroll.regexMarkdown, cb: diceroll.markdown },
		{ permLevel: markdownPermLevels.fortune, regex: fortune.regex, cb: fortune.markdown },
	];
	//todo: add any missing perm levels so no migration required so people can add custom markdown on their own. maybe give these a name property and give it a class
};

updateMarkdownPerms();
addCallback('config', updateMarkdownPerms);

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

	markdown: (text, permLevel=4) => {
		const chunks = text.split(splitRegex);
		const { highlightOptions } = config.get;
		for (let i = 0; i < chunks.length; i++) {
			//every other chunk will be a code block
			if (i % 2 === 0) {
				const escaped = escape(chunks[i]);
				const newlineFix = escaped.replace(/^\r?\n/,''); //fix ending newline because of codeblock
				chunks[i] = module.exports.processRegularChunk(newlineFix, permLevel);
			} else if (permLevel <= markdownPermLevels.code){
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
			//no language specified, try automatic syntax highlighting
			const { language, relevance, value } = highlightAuto(trimFix, highlightOptions.languageSubset);
			if (relevance > highlightOptions.threshold) {
				return `<span class='code hljs'><small>possible language: ${language}, relevance: ${relevance}</small>\n${value}</span>`;
			}
		} else if (lang === 'aa') {
			return `<span class='aa'>${escape(matches.groups.code)}</span>`;
		} else if (validLanguages.includes(lang)) {
			const { value } = highlight(trimFix, { language: lang, ignoreIllegals: true });
			return `<span class='code hljs'><small>language: ${lang}</small>\n${value}</span>`;
		}
		//else, auto highlight relevance threshold was too low, lang was not a valid language, or lang was 'plain'
		return `<span class='code'>${escape(trimFix)}</span>`;
	},

	processRegularChunk: (text, permLevel) => {
		//so theoretically now with some more options in the global manage page you can set permissions or enable/disable markdowns
		const allowedReplacements = replacements.filter(r => r.permLevel >= permLevel);
		for (let i = 0; i < allowedReplacements.length; i++) {
			//could bind more variables here and make them available as additional arguments. would pass more args -> markdown -> procesRegularChunk, etc.
			text = text.replace(allowedReplacements[i].regex, allowedReplacements[i].cb.bind(null, permLevel));
		}
		return text;
	},

}
