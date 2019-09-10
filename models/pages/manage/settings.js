'use strict';

module.exports = async (req, res, next) => {

	res.render('managesettings', {
		csrf: req.csrfToken(),
	});

}
