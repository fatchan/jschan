'use strict';

const  { promisify } = require('util')
	, randomBytes = promisify(require('crypto').randomBytes);

//NOTE: should only be used for ints, floors your inputs
module.exports = async (min, max) => {
	min = Math.floor(min);
	max = Math.floor(max);
	if (max <= min) {
		return min;
	}
	const mod = max - min + 1;
	const div = (((0xffffffff - (mod-1)) / mod) | 0) + 1;
	let g;
	do {
		g = (await randomBytes(4)).readUInt32LE();
	} while (g > div * mod - 1);
	return ((g / div) | 0) + min;
};
