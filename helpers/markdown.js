'use strict';

const Posts = require(__dirname+'/../db-models/posts.js')
	, quoteRegex = /^>>\d+/g
	, greentextRegex = /^>[^>].+/g
	, redtextRegex = /^<[^<].+/g;

module.exports = (board, thread, text) => {

	const lines = text.split('\n')

	for(let j = 0; j < lines.length; j++) {
		//replace quotes
		const quote = lines[j].match(quoteRegex);
		if (quote) {
			const quotenum = quote[0].substring(2);
			lines[j] = lines[j].replace(quote[0], `<a class='quote' href='/${board}/thread/${thread}/${quote}#${quote}'>&gt;&gt;${quotenum}</a>`);
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
	}

	return lines.join('\n');

}
