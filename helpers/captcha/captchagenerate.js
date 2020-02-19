const gm = require('gm').subClass({ imageMagick: true })
	, { Captchas } = require(__dirname+'/../../db/')
	, { captchaOptions } = require(__dirname+'/../../configs/main.js')
	, uploadDirectory = require(__dirname+'/../files/uploadDirectory.js')
	, randomRange = (min, max) => Math.floor(Math.random() * (max-min + 1) + min)
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
	, distortion = captchaOptions.distortion;

module.exports = async () => {
	const text = Math.random().toString(36).substr(2,6);
	const captchaId = await Captchas.insertOne(text).then(r => r.insertedId);
	const distorts = [];
	const numDistorts = randomRange(captchaOptions.numDistorts.min,captchaOptions.numDistorts.max);
	const div = width/numDistorts;

	for (let i = 0; i < numDistorts; i++) {
		const divStart = (div*i)
			, divEnd = (div*(i+1));
		const originx = randomRange(divStart, divEnd)
			, originy = randomRange(0,height);
		const destx = randomRange(Math.max(distortion,originx-distortion),Math.min(width-distortion,originx+distortion))
			, desty = randomRange(Math.max(distortion,originy-distortion*2),Math.min(height-distortion,originy+distortion*2));
		distorts.push([
			{x:originx,y:originy}, //origin
			{x:destx,y:desty} //dest
		]);

	}

	return new Promise((resolve, reject) => {
		const captcha = gm(width,height,'#ffffff')
		.fill('#000000')
		.fontSize(65);
		if (captchaOptions.fontPaths && captchaOptions.fontPaths.length > 0) {
			captcha.font(captchaOptions.fontPaths[Math.floor(Math.random() * captchaOptions.fontPaths.length)]);
		}
		const startX = (width-totalWidth(text))/2;
		let charX = startX;
		for (let i = 0; i < 6; i++) {
			captcha.drawText(charX, 60, text[i]);
			charX += characterWidth(text[i]);
		}
		const lineY = randomRange(35,45);
		captcha
		.drawRectangle(startX, lineY, charX, lineY+4)
		.distort(distorts, 'Shepards')
		.paint(captchaOptions.paintAmount)
		.write(`${uploadDirectory}/captcha/${captchaId}.jpg`, (err) => {
			if (err) {
				return reject(err);
			}
			return resolve({ id: captchaId, text });
		});
	});

}
