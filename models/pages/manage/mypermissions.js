'use strict';

module.exports = async (req, res, next) => {

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('managemypermissions', {
		user: res.locals.user,
		board: res.locals.board,
		permissions: res.locals.permissions,
	});

}
