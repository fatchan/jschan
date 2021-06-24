'use strict';

const parenPairRegex = /\((?:[^)(]+|\((?:[^)(]+|\([^)(]\))*\))*\)/g
//	, config = require(__dirname+'/../../config.js');

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
/*
	//todo: Something to revisit later
	const href = url;
	if (urlOnly == null) {
		try {
			const urlObject = new URL(url);
			if (config.get.allowedHosts.includes(urlObject.hostname)) {
				href = `${urlObject.pathname}${urlObject.search}${urlObject.hash}`;
			}
		} catch (e) { }
	}
*/
	return `<a rel='nofollow' referrerpolicy='same-origin' target='_blank' href='${url}'>${label || url}</a>${excess}`;
};
