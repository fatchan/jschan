'use strict';

module.exports = async (req, res, next) => {

	res.render('globalmanageboards', {
		csrf: req.csrfToken(),
	});

}
