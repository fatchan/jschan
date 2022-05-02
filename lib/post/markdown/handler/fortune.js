'use strict';

const fortunes = ['example1', 'example2', 'example3'];

module.exports = {

	fortunes,

	regex: /##fortune/gmi,

	markdown: () => {
		const randomFortune = fortunes[Math.floor(Math.random()*fortunes.length)];
		return `<span class='title'>${randomFortune}</span>`;
	},

};
