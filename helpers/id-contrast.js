'use strict';

module.exports = (hex) => {
	const r = parseInt(hex.substr(0,2), 16);
	const g = parseInt(hex.substr(2,2), 16);
	const b = parseInt(hex.substr(4,2), 16)
	return 0.375  * r + 0.5 * g + 0.125 * b;
}
