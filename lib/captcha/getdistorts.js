'use strict';

const { promisify } = require('util')
	, randomRange = promisify(require('crypto').randomInt);

module.exports = async (width, height, numDistorts, distortion) => {

	const distorts = [];
	const randNumDistorts = await randomRange(numDistorts.min, numDistorts.max + 1);

	//divide the width by number of distortions and add a distortion across the whole horizontal area
	const div = width/randNumDistorts;
	for (let i = 0; i < randNumDistorts; i++) {

		//start and end of divided width
		const divStart = (div * i)
			, divEnd = (div * (i + 1));

		//origin coordinate for distortion point
		const originx = await randomRange(divStart, divEnd)
			, originy = await randomRange(0, height);

		//destionation coordinate for distortion point
		const destx = await randomRange(Math.max(distortion, originx - distortion), Math.min(width - distortion, originx + distortion)+1)
			, desty = await randomRange(Math.max(distortion, originy - (distortion * 2)), Math.min(height - distortion, originy + (distortion * 2))+1);

		distorts.push([
			{x:originx,y:originy},
			{x:destx,y:desty}
		]);

	}

	return distorts;

};
