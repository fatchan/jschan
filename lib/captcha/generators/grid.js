'use strict';

const gm = require('@fatchan/gm').subClass({ imageMagick: true })
	, { promisify } = require('util')
	, randomBytes = promisify(require('crypto').randomBytes)
	, getDistorts = require(__dirname+'/../getdistorts.js')
	, { DejaVuSans } = require(__dirname+'/../../misc/fonts.js')
	, randomRange = promisify(require('crypto').randomInt)
	, padding = 30; //pad edge of image to account for character size + distortion

module.exports = async (captchaOptions) => {

	const { size, trues, falses, imageSize, noise, edge, iconYOffset } = captchaOptions.grid;
	const width = imageSize+padding; //TODO: these will never be different, right?
	const height = imageSize+padding;

	//number of inputs in grid, just square of size
	const numInputs = size ** 2;

	//create an array of true/false for grid from random bytes
	const randBuffer = await randomBytes(numInputs);
	const boolArray = Array.from(randBuffer).map(x => x < 80); //TODO: make 80 variable?
	//make sure there is at least one true in the array
	if (!boolArray.some(b => b === true)) {
		boolArray[(await randomRange(0, numInputs))] = true;
	}

	const captcha = gm(width, height, '#ffffff')
		.fill('#000000');

	if (captchaOptions.font !== 'default') {
		captcha.font(captchaOptions.font);
	} else {
		captcha.font(DejaVuSans.path);
	}

	//divide the space by grid size, accounting for padding
	const spaceSize = (width-padding)/size;
	const fontMinSize = Math.floor(width*0.16);
	const fontMaxSize = Math.floor(width*0.25);
	for (let j = 0; j < size; j++) { //for each row

		//x offset for whole row (not per character or it gets way too difficult to solve)
		let cxOffset = await randomRange(0, Math.floor(spaceSize * 1.5));

		for (let i = 0; i < size; i++) { //for character in row
			const index = (j*size)+i;
			const cyOffset = iconYOffset > 0 ? (await randomRange(0, iconYOffset)) : 0;
			let character;
			if (boolArray[index] === true) {
				character = trues[(await randomRange(0, trues.length))];
			} else {
				character = falses[(await randomRange(0, falses.length))];
			}
			captcha.fontSize((await randomRange(fontMinSize, fontMaxSize)));
			captcha.drawText(
				(spaceSize * i) + cxOffset,
				(spaceSize * (j + 1)) + cyOffset,
				character
			);
		}

	}

	//create an array of distortions and apply to the image, if distortion is enabled
	const { distortion, numDistorts } = captchaOptions;
	if (distortion > 0) {
		const distorts = await getDistorts(width, height, numDistorts, distortion);
		captcha.distort(distorts, 'Shepards');
	}

	//add optional edge effect
	if (edge > 0) {
		captcha.edge(edge);
	}

	//add optional noise effect
	if (noise > 0) {
		captcha.noise(noise);
	}

	return { captcha, solution: boolArray };

};
