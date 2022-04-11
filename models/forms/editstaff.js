'use strict';

const { Boards } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, Permissions = require(__dirname+'/../../lib/permission/permissions.js')
	, Permission = require(__dirname+'/../../lib/permission/permission.js');

module.exports = async (req, res, next) => {

	let updatingPermissions = new Permission(res.locals.board.staff[req.body.username].permissions);

	//maybe these can be changed
	//updatingPermissions.set(Permissions.MANAGE_BOARD_GENERSL, (req.body.MANAGE_BOARD_GENERAL != null))
	updatingPermissions.set(Permissions.MANAGE_BOARD_BANS, (req.body.MANAGE_BOARD_BANS != null))
	updatingPermissions.set(Permissions.MANAGE_BOARD_LOGS, (req.body.MANAGE_BOARD_LOGS != null))
	updatingPermissions.set(Permissions.MANAGE_BOARD_SETTINGS, (req.body.MANAGE_BOARD_SETTINGS != null))
	updatingPermissions.set(Permissions.MANAGE_BOARD_CUSTOMISATION, (req.body.MANAGE_BOARD_CUSTOMISATION != null))
	if (res.locals.permissions.get(Permissions.MANAGE_BOARD_OWNER)) {
		//be careful giving others manage_board_owner!
		updatingPermissions.set(Permissions.MANAGE_BOARD_OWNER, (req.body.MANAGE_BOARD_OWNER != null))
		updatingPermissions.set(Permissions.MANAGE_BOARD_STAFF, (req.body.MANAGE_BOARD_STAFF != null))
	}

	const updated = await Boards.setStaffPermissions(req.params.board, req.body.username, updatingPermissions).then(r => r.matchedCount);

	if (updated === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': 'Staff does not exist',
			'redirect': req.headers.referer || `/${req.params.board}/manage/staff.html`,
		});
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Edited staff',
		'redirect': `/${req.params.board}/manage/editstaff/${req.body.username}.html`,
	});

}
