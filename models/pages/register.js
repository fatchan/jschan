'use strict';

module.exports = (req, res, next) => {

	//render the page
	res.render('register', {
		csrf: req.csrfToken()
	});

}
