'use strict';

module.exports = (req, res, next) => {

	//render the page
	res.render('login', {
		csrf: req.csrfToken()
	});

}
