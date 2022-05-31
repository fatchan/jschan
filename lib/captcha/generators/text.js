'use strict';

const gm = require('@fatchan/gm').subClass({ imageMagick: true })
	, { Captchas } = require(__dirname+'/../../../db/')
	, config = require(__dirname+'/../../misc/config.js')
	, uploadDirectory = require(__dirname+'/../../file/uploaddirectory.js')
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
	, totalWidth = (text) => {
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

module.exports = async () => {

	const { captchaOptions } = config.get;

	/*	generate random between 1000000 and 1zzzzzz and not 0 and zzzzzz, so output will have
		enough characters for 000000-zzzzzz */
	const textInt = await randomRange(minVal, maxVal+1);
	const text = textInt.toString(36).substr(-6, 6);

	//insert the captcha to db and get id
	const captchaId = await Captchas.insertOne(text).then(r => r.insertedId);

	//y position for line through text
	const lineY = await randomRange(35,45);

	const captcha = gm(width,height,'#ffffff')
		.fill('#000000')
		.fontSize(65);

	//draw each character at their x based on the characterWidth()
	const startX = (width-totalWidth(text))/2;
	let charX = startX;
	for (let i = 0; i < 6; i++) {
		captcha.drawText(charX, 60, text[i]);
		charX += characterWidth(text[i]);
	}

	captcha.drawRectangle(startX, lineY, charX, lineY+4);

	//create an array of distortions and apply to the image, if distortion is enabled
	const { distortion, numDistorts } = captchaOptions;
	if (distortion > 0) {
		const distorts = await getDistorts(width, height, numDistorts, distortion);
		captcha.distort(distorts, 'Shepards');
	}

	captcha.paint(2); //paint effect makes a bit harder

	return new Promise((resolve, reject) => {
		captcha
			.write(`${uploadDirectory}/captcha/${captchaId}.jpg`, (err) => {
				if (err) {
					return reject(err);
				}
				return resolve({ captchaId });
			});
	});

};

