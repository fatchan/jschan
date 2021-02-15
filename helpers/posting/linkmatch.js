'use strict';

const parenPairRegex = /\((?:[^)(]+|\((?:[^)(]+|\([^)(]\))*\))*\)/g

module.exports = (match, p1, p2, p3, offset, string, groups) => {
	let url, label, urlOnly, excess = '';
	if (!groups) {
		const parensPairs = match.match(parenPairRegex);
		let trimmedMatch;
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
		url = trimmedMatch;
	} else {
		({ url, label, urlOnly } = groups);
		url = url || urlOnly;
	}
	//TODO: if the link domain is one of the site domains, remove the domain and make it an absolute link, for users on different domains or anonymizers
	return `<a rel='nofollow' referrerpolicy='same-origin' target='_blank' href='${url}'>${label || url}</a>${excess}`;
};
