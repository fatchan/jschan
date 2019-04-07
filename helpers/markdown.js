'use strict';

const Posts = require(__dirname+'/../db-models/posts.js')
	, quoteRegex = /^>>\d+/g
	, greentextRegex = /^>[^>].+/g
	, redtextRegex = /^<[^<].+/g
	, boldRegex = /==.+==/g
	, italicRegex = /__.+__/g
	, spoilerRegex = /\|.+\|/g;

module.exports = (board, thread, text) => {

	const lines = text.split('\n')

	for(let j = 0; j < lines.length; j++) {
		//replace quotes
		const quote = lines[j].match(quoteRegex);
		if (quote) {
			const quotenum = quote[0].substring(2);
			lines[j] = lines[j].replace(quote[0], `<a class='quote' href='/${board}/thread/${thread}#${quotenum}'>&gt;&gt;${quotenum}</a>`);
			continue;
		}
		//replace greentexts
		const greentext = lines[j].match(greentextRegex);
		if (greentext) {
			const green = greentext[0].substring(1);
			lines[j] = lines[j].replace(greentext[0], `<span class='greentext'>&gt;${green}</span>`);
			continue;
		}
		//replace redtexts
		const redtext = lines[j].match(redtextRegex);
		if (redtext) {
			const red = redtext[0].substring(1);
			lines[j] = lines[j].replace(redtext[0], `<span class='redtext'>&lt;${red}</span>`);
			continue;
		}
		//replace bolds
		const boldtext = lines[j].match(boldRegex);
		if (boldtext) {
			const bold = boldtext[0].substring(2, boldtext[0].length-2);
			lines[j] = lines[j].replace(boldtext[0], `<strong>${bold}</strong>`);
			continue;
		}
		//replace italics
		const italictext = lines[j].match(italicRegex);
		if (italictext) {
			const italic = italictext[0].substring(2, italictext[0].length-2);
			lines[j] = lines[j].replace(italictext[0], `<em>${italic}</em>`);
			continue;
		}
		//replace spoilers
		const spoilertext = lines[j].match(spoilerRegex);
		if (spoilertext) {
			const spoiler = spoilertext[0].substring(1, spoilertext[0].length-1);
			lines[j] = lines[j].replace(spoilertext[0], `<span class='spoiler'>${spoiler}</span>`);
			continue;
		}
	}

	return lines.join('\n');

}
