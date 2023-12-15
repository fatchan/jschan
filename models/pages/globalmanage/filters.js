'use strict';

const { Filters } = require(__dirname+'/../../../db/');

module.exports = async (req, res, next) => {

	let filters;
	try {
		filters = await Filters.findForBoard(null);
	} catch (err) {
		return next(err);
	}

	res
		.set('Cache-Control', 'private, max-age=5')
		.render('globalmanagefilters', {
			csrf: req.csrfToken(),
			permissions: res.locals.permissions,
			filters,
		});

};
