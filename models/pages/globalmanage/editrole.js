'use strict';

const { Roles } = require(__dirname+'/../../../db/')
	, roleManager = require(__dirname+'/../../../lib/permission/rolemanager.js')
	, Permission = require(__dirname+'/../../../lib/permission/permission.js');

module.exports = async (req, res, next) => {

	const role = await Roles.findOne(req.params.roleid);

	if (role == null) {
		//role does not exist
		return next();
	}

	res
		.set('Cache-Control', 'private, max-age=5')
		.render('editrole', {
			csrf: req.csrfToken(),
			role,
			rolePermissions: new Permission(role.permissions),
			roleNameMap: roleManager.roleNameMap,
			rolePermissionMap: roleManager.rolePermissionMap,
			permissions: res.locals.permissions,
		});

};
