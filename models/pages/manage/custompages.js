'use strict';

const CustomPages = require(__dirname+'/../../../db/custompages.js');

module.exports = async (req, res, next) => {

	let customPages;
	try {
		customPages = await CustomPages.find(req.params.board);
	} catch (err) {
		return next(err);
	}

	res
		.set('Cache-Control', 'private, max-age=5')
		.render('managecustompages', {
			csrf: req.csrfToken(),
			customPages,
		});

};
