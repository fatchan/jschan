'use strict';

const gm = require('@fatchan/gm').subClass({ imageMagick: true })
	, characterWidth = (char) => {
		switch (char) {
			case 'w':
			case 'm':
				return 45;
			case 'i':
			case 'l':
				return 12;
			case 'f':
			case 'j':
			case 't':
				return 15;
			default:
				return 30;
		}
	}
	, totalTextWidth = (text) => {
		return text.split('').reduce((acc, char) => {
			return characterWidth(char) + acc + 1;
		}, 0);
	}
	, width = 210
	, height = 80
	, minVal = parseInt('1000000', 36)
	, maxVal = parseInt('1zzzzzz', 36)
	, { promisify } = require('util')
	, randomRange = promisify(require('crypto').randomInt)
	, getDistorts = require(__dirname+'/../getdistorts.js');

module.exports = async (captchaOptions) => {

	/*	generate random between 1000000 and 1zzzzzz and not 0 and zzzzzz, so output will have
		enough characters for 000000-zzzzzz */
	const textInt = await randomRange(minVal, maxVal+1);
	const text = textInt.toString(36).substr(-6, 6);

	const captcha = gm(width,height,'#ffffff')
		.fill('#000000')
		.fontSize(65);

	if (captchaOptions.font !== 'default') {
		captcha.font(captchaOptions.font);
	}

	//draw each character at their x based on the characterWidth()
	const textWidth = totalTextWidth(text);
	const startX = (width-textWidth)/2;
	let charX = startX;
	for (let i = 0; i < 6; i++) {
		captcha.drawText(charX, 60, text[i]);
		charX += characterWidth(text[i]);
	}

	//draw optional line/strikethrough
	if (captchaOptions.text.line === true) {
		const lineY = await randomRange(35,45);
		captcha.drawRectangle(startX, lineY, startX+textWidth, lineY+4);
	}

	//add optional wave effect
	if (captchaOptions.text.wave > 0) {
		captcha.wave(captchaOptions.text.wave, width/4);
	}

	//add optional paint effect
	if (captchaOptions.text.paint > 0) {
		captcha.paint(captchaOptions.text.paint);
	}

	//add optional noise effect
	if (captchaOptions.text.noise > 0) {
		captcha.noise(captchaOptions.text.noise);
	}

	//create an array of distortions and apply to the image, if distortion is enabled
	const { distortion, numDistorts } = captchaOptions;
	if (distortion > 0) {
		const distorts = await getDistorts(width, height, numDistorts, distortion);
		captcha.distort(distorts, 'Shepards');
	}

	return { captcha, solution: text };

};

