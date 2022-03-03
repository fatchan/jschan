'use strict';

const { Roles } = require(__dirname+'/../../../db/')
	, Permission = require(__dirname+'/../../../helpers/permission.js');

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
	});

}
