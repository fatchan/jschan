'use strict';

const { Boards, Accounts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, roleManager = require(__dirname+'/../../lib/permission/rolemanager.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;
	const newOwner = res.locals.newOwner;

	//remove current owner
	await Promise.all([
		Accounts.removeOwnedBoard(res.locals.board.owner, req.params.board),
		Boards.removeStaff(req.params.board, [res.locals.board.owner]),
	]);

	//set new owner in locals
	res.locals.board.owner = newOwner._id;

	if (res.locals.board.staff[newOwner._id] != null) {
		//if already a staff, just change their permission instead of removing+adding back
		await Promise.all([
			Boards.setStaffPermissions(req.params.board, newOwner._id, roleManager.roles.BOARD_OWNER, true),
			Accounts.removeStaffBoard([newOwner._id], req.params.board),
			Accounts.addOwnedBoard(newOwner._id, req.params.board),
		]);
	} else {
		//otherwise add them as a new staff+owner
		await Promise.all([
			Boards.addStaff(req.params.board, newOwner._id, roleManager.roles.BOARD_OWNER, true),
			Accounts.addOwnedBoard(newOwner._id, req.params.board),
		]);
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Transferred ownership'),
		'redirect': `/${req.params.board}/index.html`
	});

};
