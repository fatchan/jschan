'use strict';

module.exports = (req, res) => {

	//render the page
	res.render('manage', {
		csrf: req.csrfToken()
	});

}
