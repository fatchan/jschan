'use strict';

module.exports = async (req, res, next) => {

	res
	.set('Cache-Control', 'private, max-age=60')
	.render('account', {
		user: req.session.user,
	});

}
