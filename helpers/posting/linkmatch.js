'use strict';

const parenPairRegex = /\((?:[^)(]+|\((?:[^)(]+|\([^)(]\))*\))*\)/g

module.exports = (match, label, url, urlOnly) => {
	let trimmedMatch;
	let excess = '';
	if (urlOnly) {
		const parensPairs = match.match(parenPairRegex);
		//naive solution to conflict with detected markdown
		if (parensPairs) {
			const lastMatch = parensPairs[parensPairs.length-1];
			const lastIndex = match.lastIndexOf(lastMatch);
			trimmedMatch = match.substring(0, lastIndex+lastMatch.length);
			excess = match.substring(lastIndex+lastMatch.length);
		} else if (match.indexOf(')') !== -1){
			trimmedMatch = match.substring(0, match.indexOf(')'));
			excess = match.substring(match.indexOf(')'));
		} else {
			trimmedMatch = match;
		}
		trimmedMatch = trimmedMatch
			.replace(/\(/g, '%28')
			.replace(/\)/g, '%29');
	}
	let href = url || trimmedMatch
	const aLabel = label || trimmedMatch;
	//TODO: if the link domain is one of the site domains, remove the domain and make it an absolute link, for users on different domains or anonymizers
	return `<a rel='nofollow' referrerpolicy='same-origin' target='_blank' href='${href}'>${aLabel}</a>${excess}`;
};
