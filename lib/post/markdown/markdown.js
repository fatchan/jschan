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
	/* eslint-disable no-useless-escape */
	, linkRegex = /\[(?<label>[^\[][^\]]*?)\]\((?<url>(?:&#x2F;[^\s<>\[\]{}|\\^)]+|https?\:&#x2F;&#x2F;[^\s<>\[\]{}|\\^)]+|mailto:[\w.@]+))\)|(?<urlOnly>https?\:&#x2F;&#x2F;[^\s<>\[\]{}|\\^]+)/g
	, codeRegex = /(?:(?<language>[a-z+]{1,14})\r?\n)?(?<code>[\s\S]+)/i
	, includeSplitRegex = /(\[code\][\s\S]+?\[\/code\])/gm
	, splitRegex = /\[code\]([\s\S]+?)\[\/code\]/gm
	, trimNewlineRegex = /^(\s*\r?\n)*/g
	, escape = require(__dirname+'/escape.js')
	, { highlight, highlightAuto, listLanguages } = require('highlight.js')
	, validLanguages = listLanguages() //precompute
	, { addCallback } = require(__dirname+'/../../redis/redis.js')
	, config = require(__dirname+'/../../misc/config.js')
	, diceroll = require(__dirname+'/handler/diceroll.js')
	, fortune = require(__dirname+'/handler/fortune.js')
	, linkmatch = require(__dirname+'/handler/linkmatch.js')
	, { Permissions } = require(__dirname+'/../../permission/permissions.js');

let replacements = [];

const updateMarkdownPerms = () => {
	replacements = [
		{ permission: Permissions.USE_MARKDOWN_PINKTEXT, regex: pinktextRegex, cb: (permissions, match, pinktext) => `<span class='pinktext'>&lt;${pinktext}</span>` },
		{ permission: Permissions.USE_MARKDOWN_GREENTEXT, regex: greentextRegex, cb: (permissions, match, greentext) => `<span class='greentext'>&gt;${greentext}</span>` },
		{ permission: Permissions.USE_MARKDOWN_BOLD, regex: boldRegex, cb: (permissions, match, bold) => `<span class='bold'>${bold}</span>` },
		{ permission: Permissions.USE_MARKDOWN_UNDERLINE, regex: underlineRegex, cb: (permissions, match, underline) => `<span class='underline'>${underline}</span>` },
		{ permission: Permissions.USE_MARKDOWN_STRIKETHROUGH, regex: strikeRegex, cb: (permissions, match, strike) => `<span class='strike'>${strike}</span>` },
		{ permission: Permissions.USE_MARKDOWN_TITLE, regex: titleRegex, cb: (permissions, match, title) => `<span class='title'>${title}</span>` },
		{ permission: Permissions.USE_MARKDOWN_ITALIC, regex: italicRegex, cb: (permissions, match, italic) => `<span class='em'>${italic}</span>` },
		{ permission: Permissions.USE_MARKDOWN_SPOILER, regex: spoilerRegex, cb: (permissions, match, spoiler) => `<span class='spoiler'>${spoiler}</span>` },
		{ permission: Permissions.USE_MARKDOWN_MONO, regex: monoRegex, cb: (permissions, match, mono) => `<span class='mono'>${mono}</span>` },
		{ permission: Permissions.USE_MARKDOWN_DETECTED, regex: detectedRegex, cb: (permissions, match, detected) => `<span class='detected'>&lpar;&lpar;&lpar; ${detected} &rpar;&rpar;&rpar;</span>` },
		{ permission: Permissions.USE_MARKDOWN_LINK, regex: linkRegex, cb: linkmatch },
		{ permission: Permissions.USE_MARKDOWN_DICE, regex: diceroll.regexMarkdown, cb: diceroll.markdown },
		{ permission: Permissions.USE_MARKDOWN_FORTUNE, regex: fortune.regex, cb: fortune.markdown },
	];
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
					diceroll.regexPrepare, diceroll.prepare.bind(null, force));
			}
		}
		return chunks.join('');
	},

	markdown: (text, permissions) => {
		const chunks = text.split(splitRegex);
		const { highlightOptions } = config.get;
		for (let i = 0; i < chunks.length; i++) {
			//every other chunk will be a code block
			if (i % 2 === 0) {
				const escaped = escape(chunks[i]);
				const newlineFix = escaped.replace(/^\r?\n/,''); //fix ending newline because of codeblock
				chunks[i] = module.exports.processRegularChunk(newlineFix, permissions);
			} else if (permissions.get(Permissions.USE_MARKDOWN_CODE)){
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

	processRegularChunk: (text, permissions) => {
		//filter replacements based on their permissions
		const allowedReplacements = replacements.filter(r => permissions.get(r.permission));
		for (let i = 0; i < allowedReplacements.length; i++) {
			//could bind more variables here and make them available as additional arguments. would pass more args -> markdown -> procesRegularChunk, etc.
			text = text.replace(allowedReplacements[i].regex, allowedReplacements[i].cb.bind(null, permissions));
		}
		return text;
	},

};
