'use strict';

module.exports = async (req, res, next) => {

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('account', {
		user: res.locals.user,
	});

}
