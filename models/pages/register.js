'use strict';

module.exports = (req, res) => {

	//send home if already logged in
	if (req.session.authenticated === true) {
		return res.status(400).render('message', {
			'title': 'Notice',
			'message': 'You are already logged in. Redirecting you to back home.',
			'redirect': '/'
		});
	}

	//render the page
	res.render('register', {
		csrf: req.csrfToken()
	});

}
