'use strict';

const parenPairRegex = /\((?:[^)(]+|\((?:[^)(]+|\([^)(]\))*\))*\)/g

module.exports = (permLevel, match, p1, p2, p3, offset, string, groups) => {
	let { url, label, urlOnly } = groups
		, excess = '';
	url = url || urlOnly;
	if (urlOnly) {
		const parensPairs = url.match(parenPairRegex);
		let trimmedMatch = url;
		//naive solution to conflict with detected markdown
		if (parensPairs) {
			const lastMatch = parensPairs[parensPairs.length-1];
			const lastIndex = url.lastIndexOf(lastMatch);
			trimmedMatch = url.substring(0, lastIndex+lastMatch.length);
			excess = url.substring(lastIndex+lastMatch.length);
		} else if (url.indexOf(')') !== -1){
			trimmedMatch = url.substring(0, url.indexOf(')'));
			excess = url.substring(url.indexOf(')'));
		}
		url = trimmedMatch;
	}
	if (permLevel >= 4) {
		label = url
			.replace(/\(/g, '&lpar;')
			.replace(/\)/g, '&rpar;');
	}
	url = url.replace(/\(/g, '%28')
			.replace(/\)/g, '%29');
	//TODO: if the link domain is one of the site domains, remove the domain and make it an absolute link, for users on different domains or anonymizers
	return `<a rel='nofollow' referrerpolicy='same-origin' target='_blank' href='${url}'>${label || url}</a>${excess}`;
};
