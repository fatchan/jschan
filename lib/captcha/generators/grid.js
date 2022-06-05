'use strict';

const gm = require('@fatchan/gm').subClass({ imageMagick: true })
	, { promisify } = require('util')
	, randomBytes = promisify(require('crypto').randomBytes)
	, { Captchas } = require(__dirname+'/../../../db/')
	, config = require(__dirname+'/../../misc/config.js')
	, uploadDirectory = require(__dirname+'/../../file/uploaddirectory.js')
	, getDistorts = require(__dirname+'/../getdistorts.js')
	, randomRange = promisify(require('crypto').randomInt)
	, padding = 30 //pad edge of image to account for character size + distortion
	, zeros = ['○','□','♘','♢','▽','△','♖','✧','♔','♘','♕','♗','♙','♧']
	, ones = ['●','■','♞','♦','▼','▲','♜','✦','♚','♞','♛','♝','♟','♣'];

module.exports = async () => {

	const { captchaOptions } = config.get;

	const gridSize = captchaOptions.grid.size;
	const width = captchaOptions.grid.imageSize+padding;
	const height = captchaOptions.grid.imageSize+padding;

	//number of inputs in grid, just square of gridSize
	const numInputs = gridSize ** 2;

	//create an array of true/false for grid from random bytes
	const randBuffer = await randomBytes(numInputs);
	const boolArray = Array.from(randBuffer).map(x => x < 80); //TODO: make 80 variable?
	//make sure there is at least one true in the array
	if (!boolArray.some(b => b === true)) {
		boolArray[(await randomRange(0, numInputs))] = true;
	}

	//insert the captcha to db and get id
	const captchaId = await Captchas.insertOne(boolArray).then(r => r.insertedId);

	const captcha = gm(width, height, '#ffffff')
		.fill('#000000')
		.font(__dirname+'/../font.ttf');

	//divide the space by grid size, accounting for padding
	const spaceSize = (width-padding)/gridSize;
	for(let j = 0; j < gridSize; j++) { //for each row

		//x offset for whole row (not per character or it gets way too difficult to solve)
		let cxOffset = await randomRange(0, spaceSize * 1.5);

		for(let i = 0; i < gridSize; i++) { //for character in row
			const index = (j*gridSize)+i;
			const cyOffset = await randomRange(0, captchaOptions.grid.iconYOffset);
			const charIndex = await randomRange(0, ones.length);
			const character = (boolArray[index] ? ones : zeros)[charIndex];
			captcha.fontSize((await randomRange(20, 30)));
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

	//apply strong edge detection, makes it harder and fills empty areas
	captcha.edge(25);

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
