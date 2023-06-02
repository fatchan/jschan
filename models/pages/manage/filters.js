'use strict';

const { Filters } = require(__dirname+'/../../../db/');

module.exports = async (req, res, next) => {

	let filters;
	try {
		filters = await Filters.findForBoard(req.params.board);
	} catch (err) {
		return next(err);
	}

	res
		.set('Cache-Control', 'private, max-age=5')
		.render('managefilters', {
			csrf: req.csrfToken(),
			permissions: res.locals.permissions,
			filters,
		});

};
