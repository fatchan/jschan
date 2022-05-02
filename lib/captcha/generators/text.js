'use strict';

const gm = require('gm').subClass({ imageMagick: true })
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
	, randomRange = require(__dirname+'/../../misc/randomrange.js');

module.exports = async () => {
	// generate between 1000000 and 1zzzzzz and not 0 and zzzzzz, so toString
	// will have enough characters
	const { captchaOptions } = config.get;
	const distortion = captchaOptions.distortion;
	const textInt = await randomRange(minVal, maxVal);
	const text = textInt.toString(36).substr(-6, 6);
	const captchaId = await Captchas.insertOne(text).then(r => r.insertedId);
	const distorts = [];
	const numDistorts = await randomRange(
		captchaOptions.numDistorts.min,captchaOptions.numDistorts.max);
	const div = width/numDistorts;

	for (let i = 0; i < numDistorts; i++) {
		const divStart = (div*i)
			, divEnd = (div*(i+1));
		const originx = await randomRange(divStart, divEnd)
			, originy = await randomRange(0,height);
		const destx = await randomRange(Math.max(distortion,originx-distortion),Math.min(width-distortion,originx+distortion))
			, desty = await randomRange(Math.max(distortion,originy-distortion*2),Math.min(height-distortion,originy+distortion*2));
		distorts.push([
			{x:originx,y:originy}, //origin
			{x:destx,y:desty} //dest
		]);

	}

	const lineY = await randomRange(35,45);
	return new Promise((resolve, reject) => {
		const captcha = gm(width,height,'#ffffff')
			.fill('#000000')
			.fontSize(65);
		const startX = (width-totalWidth(text))/2;
		let charX = startX;
		for (let i = 0; i < 6; i++) {
			captcha.drawText(charX, 60, text[i]);
			charX += characterWidth(text[i]);
		}
		captcha
			.drawRectangle(startX, lineY, charX, lineY+4)
			.distort(distorts, 'Shepards')
			.paint(2)
			.write(`${uploadDirectory}/captcha/${captchaId}.jpg`, (err) => {
				if (err) {
					return reject(err);
				}
				return resolve({ captchaId });
			});
	});

};

