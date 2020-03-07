'use strict';

const parenPairRegex = /\((?:[^)(]+|\((?:[^)(]+|\([^)(]\))*\))*\)/g

module.exports = (match) => {
	let trimmedMatch;
	let excess = '';
	const parensPairs = match.match(parenPairRegex);
	//naive solution
	if (parensPairs) {
		const lastMatch = parensPairs[parensPairs.length-1];
		const lastIndex = match.lastIndexOf(lastMatch);
		trimmedMatch = match.substring(0, lastIndex+lastMatch.length);
		excess = match.substring(lastIndex+lastMatch.length);
	} else {
		trimmedMatch = match.substring(0, match.indexOf(')'));
		excess = match.substring(match.indexOf(')'));
	}
	trimmedMatch = trimmedMatch
		.replace(/\(/g, '%28')
		.replace(/\)/g, '%29');
	return `<a rel='nofollow' referrerpolicy='same-origin' target='_blank' href='${trimmedMatch}'>${trimmedMatch}</a>${excess}`;
};
