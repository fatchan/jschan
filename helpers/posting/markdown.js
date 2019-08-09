'use strict';

const greentextRegex = /^&gt;((?!&gt;).+)/gm
	, pinktextRegex = /^&lt;(.+)/gm
	, boldRegex = /&#39;&#39;(.+?)&#39;&#39;/gm
	, titleRegex = /&#x3D;&#x3D;(.+?)&#x3D;&#x3D;/gm
	, monoRegex = /&#x60;(.+?)&#x60;/gm
	, underlineRegex = /__(.+?)__/gm
	, strikethroughRegex = /~~(.+?)~~/gm
	, italicRegex = /\*\*(.+?)\*\*/gm
	, spoilerRegex = /\|\|(.+?)\|\|/gm
	, detectedRegex = /(\(\(\(.+?\)\)\))/gm
	, linkRegex = /https?\:&#x2F;&#x2F;[^\s<>\[\]{}|\\^]+/g
	, codeRegex = /&#x60;&#x60;&#x60;([\s\S]+?)&#x60;&#x60;&#x60;/gm
	, diceRegex = /##(?<numdice>\d+)d(?<numsides>\d+)(?:(?<operator>[+-])(?<modifier>\d+))?/gmi

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
		return `<a referrerpolicy='same-origin' target='_blank' href='${match}'>${match}</a>`;
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
        return `<span class='code'>${code.replace(/^\s*\n/, '')}</span>`;
    });

	//inline monospace
	text = text.replace(monoRegex, (match, mono) => {
        return `<span class='mono'>${mono}</span>`;
    });

	//detected
	text = text.replace(detectedRegex, (match, detected) => {
        return `<span class='detected'>${detected}</span>`;
    });

	//detected
	text = text.replace(diceRegex, (match, numdice, numsides, operator, modifier) => {
		numdice = parseInt(numdice);
		if (numdice > 100) {
			numdice = 100;
		} else if (numdice <= 0) {
			numdice =1;
		}
		numsides = parseInt(numsides);
		if (numsides > 100) {
			numsides = 100;
		} else if (numsides <= 0) {
			numsides = 1;
		}
		let sum = 0;
		for (let i = 0; i < numdice; i++) {
			const roll = Math.floor(Math.random() * numsides)+1;
			sum += roll;
		}
		if (modifier && operator) {
			modifier = parseInt(modifier);
			//do i need to make sure it doesnt go negative or maybe give absolute value?
			if (operator === '+') {
				sum += modifier;
			} else {
				sum -= modifier;
			}
		}
		return `\n<span class='dice'>(${match}) Rolled ${numdice} dice with ${numsides} sides${modifier ? ' and modifier '+operator+modifier : '' } = ${sum}</span>\n`
    });


	return text;

}

