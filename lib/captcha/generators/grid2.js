'use strict';

const gm = require('@fatchan/gm').subClass({ imageMagick: true })
	, { promisify } = require('util')
	, { DejaVuSans } = require(__dirname+'/../../misc/fonts.js')
	, getDistorts = require(__dirname+'/../getdistorts.js')
	, randomRange = promisify(require('crypto').randomInt)
	, randomBytes = promisify(require('crypto').randomBytes)
	, padding = 30 //pad edge of image to account for character size + distortion
	, nArrows = ['↑', '↟', '↥', '↾', '↿', '⇑', '⇡']
	, eArrows = ['➸', '→', '➳', '➵', '→', '↛', '↠', '↣', '↦', '↪', '↬', '↱', '↳', '⇉', '⇏', '⇒', '⇛', '⇝', '⇢']
	, wArrows = [ '←', '↚', '↞', '↜', '↢', '↩', '↤', '↫', '↰', '↲', '↵', '⇇', '⇍', '⇐', '⇚', '⇜', '⇠']
	, sArrows = ['↓', '↡', '↧', '↴', '⇂', '⇃', '⇊', '⇓', '⇣']
	, allArrows = [...nArrows, ...eArrows, ...wArrows, ...sArrows]
	, randomBool = async (p) => { return ((await randomBytes(1))[0] > p); }
	, randomOf = async (arr) => { return arr[(await randomRange(0, arr.length))]; };
	//TODO: last two could belong in lib/misc/(random?)
	
module.exports = async (captchaOptions) => {

	const { size, trues, falses, imageSize, noise, edge } = captchaOptions.grid;
	const width = imageSize+padding; //TODO: these will never be different, right?
	const height = imageSize+padding;

	const charMatrix = new Array(size).fill(false)
		.map(() => new Array(size).fill(false));
	const answerMatrix = new Array(size).fill(false)
		.map(() => new Array(size).fill(false));

	//put the icon arrows should point at
	const correctRow = await randomRange(0, size);
	const correctCol = await randomRange(0, size);
	charMatrix[correctRow][correctCol] = await randomOf(trues);

	//put correct and incorrect arrows in the row/column
	const numArray = [...new Array(size).keys()];
	const perpendicularRows = numArray.filter(x => x !== correctRow);
	for (let row of perpendicularRows) {
		/*TODO: necessary to memoize these "inverse" sets of arrows? or maybe instead of even doing a 50/50
		random, it should just pick a random from allArrows then set the isCorrect based on if its in the correct set?*/
		let arrows;
		const isCorrect = await randomBool(127);
		if (row < correctRow) {
			arrows = isCorrect ? sArrows : [...nArrows, ...eArrows, ...wArrows];
		} else if (row > correctRow) {
			arrows = isCorrect ? nArrows : [...sArrows, ...eArrows, ...wArrows];
		}
		charMatrix[row][correctCol] = await randomOf(arrows);
		answerMatrix[row][correctCol] = isCorrect;		
	}
	const perpendicularCols = numArray.filter(x => x !== correctCol);
	for (let col of perpendicularCols) {
		let arrows;
		const isCorrect = await randomBool(127);
		if (col < correctCol) {
			arrows = isCorrect ? eArrows : [...sArrows, ...nArrows, ...wArrows];
		} else if (col > correctCol) {
			arrows = isCorrect ? wArrows : [...sArrows, ...nArrows, ...eArrows];
		}
		charMatrix[correctRow][col] = await randomOf(arrows);
		answerMatrix[correctRow][col] = isCorrect;
	}
//TODO: diagonals? need more arrows

	//this sucks
	if (!answerMatrix.flat().some(x => x === true)) {
		if ((await randomBool(127)) === true) {
			const randomRow = await randomOf(perpendicularRows);
			const arrows = randomRow < correctRow ? sArrows : nArrows;
			charMatrix[randomRow][correctCol] = await randomOf(arrows);
			answerMatrix[randomRow][correctCol] = true;
		} else {
			const randomCol = await randomOf(perpendicularCols);
			const arrows = randomCol < correctCol ? eArrows : wArrows;
			charMatrix[correctRow][randomCol] = await randomOf(arrows);
			answerMatrix[correctRow][randomCol] = true;
		}
	}

	//fill the rest with junk arrows/falses
	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			if (charMatrix[row][col] === false) {
				charMatrix[row][col] = (await randomBool(80))
					? (await randomOf(allArrows))
					: (await randomOf(falses));
			}
		}
	}
	
	const captcha = gm(width, height, '#ffffff')
		.fill('#000000');

	if (captchaOptions.font !== 'default') {
		captcha.font(captchaOptions.font);
	} else {
		captcha.font(DejaVuSans.path);
	}

	const spaceSize = (width-padding)/size;
	const fontMinSize = Math.floor(width*0.16);
	const fontMaxSize = Math.floor(width*0.25);
	for (let row = 0; row < size; row++) {
		let cxOffset = Math.floor(spaceSize * 1.5);
		for (let col = 0; col < size; col++) {
			const cyOffset = captchaOptions.grid.iconYOffset;
			captcha.fontSize((await randomRange(fontMinSize, fontMaxSize)));
			captcha.drawText(
				(spaceSize * col) + cyOffset,
				(spaceSize * row) + cxOffset,
				charMatrix[row][col]
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

	return { captcha, solution: answerMatrix.flat() };

};
