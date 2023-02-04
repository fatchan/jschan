'use strict';

const { Boards } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, Permission = require(__dirname+'/../../lib/permission/permission.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;
	let updatingPermissions = new Permission(res.locals.board.staff[req.body.username].permissions);

	updatingPermissions = new Permission(res.locals.board.staff[req.body.username].permissions);
	updatingPermissions.handleBody(req.body, res.locals.permissions, true);
	// updatingPermissions.applyInheritance();

	const updated = await Boards.setStaffPermissions(req.params.board, req.body.username, updatingPermissions).then(r => r.matchedCount);

	if (updated === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': __('Bad request'),
			'errors': __('Staff does not exist'),
			'redirect': req.headers.referer || `/${req.params.board}/manage/staff.html`,
		});
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Edited staff'),
		'redirect': `/${req.params.board}/manage/editstaff/${req.body.username}.html`,
	});

};
