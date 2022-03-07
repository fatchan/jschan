'use strict';

const { Roles } = require(__dirname+'/../../../db/')
	, roleManager = require(__dirname+'/../../../helpers/rolemanager.js');

module.exports = async (req, res, next) => {

	const allRoles = await Roles.find();

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('globalmanageroles', {
		csrf: req.csrfToken(),
		permissions: res.locals.permissions,
		allRoles,
		roleNameMap: roleManager.roleNameMap,
	});

}
