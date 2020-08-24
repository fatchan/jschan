'use strict';

const  { promisify } = require('util')
	, randomBytes = promisify(require('crypto').randomBytes);

module.exports = async (min, max) => {
	if (max <= min) return min;
	const mod = max - min + 1;
	const div = Math.ceil(Math.log2(mod));
	const numberBytes = Math.ceil(div / 4);
	const mask = (1 << div) - 1;
	let rand;
	do {
		rand = (await randomBytes(numberBytes)).readUIntBE(0, numberBytes);
		rand = rand & mask;
	} while (rand >= mod);
	return rand + min;
}
