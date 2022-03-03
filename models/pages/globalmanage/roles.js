'use strict';

const { Roles } = require(__dirname+'/../../../db/')

module.exports = async (req, res, next) => {

	const roles = await Roles.find();

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('globalmanageroles', {
		csrf: req.csrfToken(),
		permissions: res.locals.permissions,
		roles,
	});

}
