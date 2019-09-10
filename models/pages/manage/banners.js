'use strict';

module.exports = async (req, res, next) => {

	res.render('managebanners', {
		csrf: req.csrfToken(),
	});

}
