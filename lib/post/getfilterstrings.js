'use strict';

module.exports = (req, res) => {

	//combines a bunch of parts of the post (name, subject, message, filenames+phashes)
	const fileStrings = res.locals.numFiles ? req.files.file.map(f => `${f.name}|${f.phash || ''}|${f.sha256 || ''}`).join('|') : 0;
	const combinedString = [req.body.name, req.body.message, req.body.subject, req.body.email, fileStrings].join('|').toLowerCase();

	//"strict" filtering adds a bunch of permutations to also compare filters with;
	let strictCombinedString = combinedString;

	//diacritics and "zalgo" removed
	strictCombinedString += combinedString.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

	//zero width spaces removed
	strictCombinedString += combinedString.replace(/[\u200B-\u200D\uFEFF]/g, '');

	//just a-z, 0-9, . and -
	strictCombinedString += combinedString.replace(/[^a-zA-Z0-9.-]+/gm, '');

	//urlendoded characters in URLs replaced (todo: remove this if/when the url regex gets updated to no longer match these)
	strictCombinedString += combinedString.split(/(%[^%]+)/).map(part => {
		try {
			return decodeURIComponent(part);
		} catch (e) {
			return '';
		}
	}).join('');

	return  { combinedString, strictCombinedString };

};
