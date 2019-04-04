'use strict';

module.exports = (req, res) => {

	//render the page
	res.render('login', {
		csrf: req.csrfToken()
	});

}
