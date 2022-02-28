'use strict';

const { Accounts } = require(__dirname+'/../../../db/')
	, { permTemplates } = require(__dirname+'/../../../helpers/permtemplates.js')
	, Permission = require(__dirname+'/../../../helpers/permission.js');

module.exports = async (req, res, next) => {

	const editingAccount = await Accounts.findOne(req.params.accountusername);

	if (editingAccount == null) {
		//account does not exist
		return next();
	}

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('editaccount', {
		csrf: req.csrfToken(),
		board: res.locals.board,
		accountUsername: req.params.accountusername,
		accountPermissions: new Permission(editingAccount.permissions),
		permTemplates,
	});

}
