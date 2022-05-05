'use strict';

const gm = require('gm').subClass({ imageMagick: true })
	, { promisify } = require('util')
	, randomBytes = promisify(require('crypto').randomBytes)
	, { Captchas } = require(__dirname+'/../../../db/')
	, config = require(__dirname+'/../../misc/config.js')
	, uploadDirectory = require(__dirname+'/../../file/uploaddirectory.js')
	, randomRange = require(__dirname+'/../../misc/randomrange.js')
	, padding = 30
	, zeros = ['○','□','♘','♢','▽','△','♖','✧','♔','♘','♕','♗','♙','♧']
	, ones = ['●','■','♞','♦','▼','▲','♜','✦','♚','♞','♛','♝','♟','♣'];

module.exports = async () => {
	const { captchaOptions } = config.get;
	const gridSize = captchaOptions.grid.size;
	const width = captchaOptions.grid.imageSize+padding;
	const height = captchaOptions.grid.imageSize+padding;
	//number of inputs in grid
	const numInputs = gridSize**2;
	//random buffer to get true/false for grid from
	const randBuffer = await randomBytes(numInputs);
	//array of true/false, for each grid input
	const boolArray = Array.from(randBuffer).map(x => x < 80);
	if (!boolArray.some(b => b === true)) {
		boolArray[(await randomRange(0,numInputs-1))] = true;
	}

	const captchaId = await Captchas.insertOne(boolArray).then(r => r.insertedId);

	const distorts = [];
	if (captchaOptions.distortion > 0) {
		const numDistorts = await randomRange(captchaOptions.numDistorts.min,captchaOptions.numDistorts.max);
		const div = width/numDistorts;
		for (let i = 0; i < numDistorts; i++) {
			const divStart = (div*i)
				, divEnd = (div*(i+1));
			const originx = await randomRange(divStart, divEnd)
				, originy = await randomRange(0,height);
			const destx = await randomRange(Math.max(captchaOptions.distortion,originx-captchaOptions.distortion),Math.min(width-captchaOptions.distortion,originx+captchaOptions.distortion)).catch(e => console.error(e))
				, desty = await randomRange(Math.max(captchaOptions.distortion,originy-captchaOptions.distortion*2),Math.min(height-captchaOptions.distortion,originy+captchaOptions.distortion*2)).catch(e => console.error(e));
			distorts.push([
				{x:originx,y:originy},
				{x:destx,y:desty}
			]);
		}
	}

	const captcha = gm(width,height,'#ffffff')
		.fill('#000000')
		.font(__dirname+'/../font.ttf');

	const spaceSize = (width-padding)/gridSize;
	for(let j = 0; j < gridSize; j++) {
		let cxOffset = await randomRange(0, spaceSize*1.5);
		for(let i = 0; i < gridSize; i++) {
			const index = (j*gridSize)+i;
			const cyOffset = await randomRange(0, captchaOptions.grid.iconYOffset);
			const charIndex = await randomRange(0, ones.length-1);
			const character = (boolArray[index] ? ones : zeros)[charIndex];
			captcha.fontSize((await randomRange(20,30)));
			captcha.drawText(
				spaceSize*(i)+cxOffset,
				spaceSize*(j+1)+cyOffset,
				character
			);
		}
	}

	if (captchaOptions.distortion > 0) {
		captcha.distort(distorts, 'Shepards');
	}

	captcha
		.edge(25);

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
