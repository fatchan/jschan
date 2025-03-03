'use strict';

const { Roles } = require(__dirname+'/../../../db/')
	, roleManager = require(__dirname+'/../../../lib/permission/rolemanager.js');

module.exports = async (req, res) => {

	const allRoles = await Roles.find();

	res.set('Cache-Control', 'private, max-age=5');

	if (req.path.endsWith('.json')) {
		res.json(allRoles);
	} else {
		res.render('globalmanageroles', {
			csrf: req.csrfToken(),
			permissions: res.locals.permissions,
			allRoles,
			roleNameMap: roleManager.roleNameMap,
			rolePermissionMap: roleManager.rolePermissionMap,
		});
	}

};
