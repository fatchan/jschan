'use strict';

const { CustomPages } = require(__dirname+'/../../../db/');

module.exports = async (req, res, next) => {

	let customPage;
	try {
		customPage = await CustomPages.findOneId(req.params.custompageid, req.params.board);
	} catch (err) {
		return next(err);
	}

	if (!customPage) {
		return next();
	}

	res
		.set('Cache-Control', 'private, max-age=5')
		.render('editcustompage', {
			csrf: req.csrfToken(),
			page: customPage,
			board: res.locals.board,
		});

};
