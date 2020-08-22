const gm = require('gm').subClass({ imageMagick: true })
	, { Captchas } = require(__dirname+'/../../../db/')
	, { captchaOptions } = require(__dirname+'/../../../configs/main.js')
	, uploadDirectory = require(__dirname+'/../../files/uploadDirectory.js')
	, { promisify } = require('util')
	, randomBytes = promisify(require('crypto').randomBytes)
	, randomRange = async (min, max) => {
		if (max <= min) return min;
		const mod = max - min + 1;
		const div = (((0xffffffff - (mod-1)) / mod) | 0) + 1;
		let g
		do {
			g = (await randomBytes(4)).readUInt32LE();
		} while (g > div * mod - 1);
		return ((g / div) | 0) + min;
	}
	, crop = 30
	, width = captchaOptions.imageSize+crop
	, height = captchaOptions.imageSize+crop
	, gridSize = captchaOptions.gridSize
	, zeros = ['○','□','♘','♢','▽','△','♖','✧','♔','♘','♕','♗','♙','♧']
	, ones = ['●','■','♞','♦','▼','▲','♜','✦','♚','♞','♛','♝','♟','♣']

module.exports = async () => {
	//number of inputs in grid
	const numInputs = gridSize**2;
	//random buffer to get true/false for grid from
	const randBuffer = await randomBytes(numInputs);
	//array of true/false, for each grid input
	const boolArray = Array.from(randBuffer).map(x => x < 80);

	const captchaId = await Captchas.insertOne(boolArray).then(r => r.insertedId);

	const distorts = [];
	const numDistorts = await randomRange(captchaOptions.numDistorts.min,captchaOptions.numDistorts.max);
	const div = width/numDistorts;
	for (let i = 0; i < numDistorts; i++) {
		const divStart = (div*i)
			, divEnd = (div*(i+1));
		const originx = await randomRange(divStart, divEnd)
			, originy = await randomRange(0,height);
		const destx = await randomRange(Math.max(captchaOptions.distortion,originx-captchaOptions.distortion),Math.min(width-captchaOptions.distortion,originx+captchaOptions.distortion))
			, desty = await randomRange(Math.max(captchaOptions.distortion,originy-captchaOptions.distortion*2),Math.min(height-captchaOptions.distortion,originy+captchaOptions.distortion*2));
		distorts.push([
			{x:originx,y:originy},
			{x:destx,y:desty}
		]);
	}

	return new Promise(async(resolve, reject) => {
		const captcha = gm(width,height,'#ffffff')
		.fill('#000000')
		.font(__dirname+'/../font.ttf');

		const spaceSize = (width-crop)/gridSize;
		for(let i = 0, j = 0; i < boolArray.length; i++) {
			if (i % gridSize === 0) { j++ }
			const cxOffset = await randomRange(0, spaceSize*0.75);
			const cyOffset = await randomRange(spaceSize/2, spaceSize);
			const charIndex = await randomRange(0, ones.length-1);
			const character = (boolArray[i] ? ones : zeros)[charIndex];
			captcha.fontSize((await randomRange(20,30)))
			captcha.drawText(
				(spaceSize*(i%gridSize))+cxOffset+(crop/2),
				(spaceSize*(j-1))+cyOffset+(crop/2),
				character
			);
		}
		captcha
		.distort(distorts, 'Shepards')
		.edge(25)
//		.quality(10)
		.crop(captchaOptions.imageSize,captchaOptions.imageSize,crop/2,crop/2)
		.write(`${uploadDirectory}/captcha/${captchaId}.jpg`, (err) => {
			if (err) {
				return reject(err);
			}
			return resolve({ id: captchaId });
		});
	});

}
