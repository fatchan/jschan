'use strict';

const { Accounts } = require(__dirname+'/../../../db/')
	, roleManager = require(__dirname+'/../../../lib/permission/rolemanager.js')
	, Permission = require(__dirname+'/../../../lib/permission/permission.js');

module.exports = async (req, res, next) => {

	const editingAccount = await Accounts.findOne(req.params.accountusername);

	if (editingAccount == null) {
		//account does not exist
		return next();
	}

	const accountPermissions = new Permission(editingAccount.permissions);
	//accountPermissions.applyInheritance();

	res
		.set('Cache-Control', 'private, max-age=5')
		.render('editaccount', {
			csrf: req.csrfToken(),
			board: res.locals.board,
			accountUsername: req.params.accountusername,
			accountPermissions,
			roles: roleManager.roles,
			permissions: res.locals.permissions,
		});

};
