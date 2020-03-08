'use strict';

module.exports = (match, numdice, numsides, operator, modifier) => {
	numdice = parseInt(numdice);
	numsides = parseInt(numsides);
	let sum = (Math.floor(Math.random() * numsides) + 1) * numdice;
	if (modifier && operator) {
		modifier = parseInt(modifier);
		//do i need to make sure it doesnt go negative or maybe give absolute value?
		if (operator === '+') {
			sum += modifier;
		} else {
			sum -= modifier;
		}
	}
	return `<img src='/img/dice.png' height='16' width='16' /><span class='dice'>(${match}) Rolled ${numdice} dice with ${numsides} sides${modifier ? ' and modifier '+operator+modifier : '' } = ${sum}</span>`;
}
