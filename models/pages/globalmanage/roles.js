'use strict';

const { Roles } = require(__dirname+'/../../../db/')
	, roles = require(__dirname+'/../../../helpers/roles.js');

module.exports = async (req, res, next) => {

	const allRoles = await Roles.find();

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('globalmanageroles', {
		csrf: req.csrfToken(),
		permissions: res.locals.permissions,
		allRoles,
		roleNameMap: roles.roleNameMap,
	});

}
