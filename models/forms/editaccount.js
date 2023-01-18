'use strict';

const { Accounts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, Permission = require(__dirname+'/../../lib/permission/permission.js');

module.exports = async (req, res) => {

	let updatingPermissions;

	if (req.body.template) {
		updatingPermissions = new Permission(req.body.template);
	} else {
		updatingPermissions = new Permission(res.locals.editingAccount.permissions);
		updatingPermissions.handleBody(req.body, res.locals.permissions);
	}
	// updatingPermissions.applyInheritance();

	const updated = await Accounts.setAccountPermissions(req.body.username, updatingPermissions).then(r => r.matchedCount);

	if (updated === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': 'Account does not exist',
			'redirect': req.headers.referer || '/globalmanage/accounts.html',
		});
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Edited account',
		'redirect': `/globalmanage/editaccount/${req.body.username}.html`,
	});

};
