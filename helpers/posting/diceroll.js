'use strict';

module.exports = (match, numdice, numsides, operator, modifier) => {
	numdice = parseInt(numdice);
	if (numdice > 100) {
		numdice = 100;
	} else if (numdice <= 0) {
		numdice = 1;
	}
	numsides = parseInt(numsides);
	if (numsides > 100) {
		numsides = 100;
	} else if (numsides <= 0) {
		numsides = 1;
	}
	let sum = 0;
	for (let i = 0; i < numdice; i++) {
		const roll = Math.floor(Math.random() * numsides)+1;
		sum += roll;
	}
	if (modifier && operator) {
		modifier = parseInt(modifier);
		//do i need to make sure it doesnt go negative or maybe give absolute value?
		if (operator === '+') {
			sum += modifier;
		} else {
			sum -= modifier;
		}
	}
	return `\n<img src='/img/dice.png' height='16' width='16' /><span class='dice'>(${match}) Rolled ${numdice} dice with ${numsides} sides${modifier ? ' and modifier '+operator+modifier : '' } = ${sum}</span>\n`;
}
