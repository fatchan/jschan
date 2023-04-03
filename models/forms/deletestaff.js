'use strict';

const { Boards, Accounts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;
	//only a ROOT could do this, per the permission bypass in the controller
	const deletingBoardOwner = req.body.checkedstaff.some(s => s === res.locals.board.owner);

	await Promise.all([
		Accounts.removeStaffBoard(req.body.checkedstaff, res.locals.board._id),
		Boards.removeStaff(res.locals.board._id, req.body.checkedstaff),
		deletingBoardOwner ? Accounts.removeOwnedBoard(res.locals.board.owner, res.locals.board._id) : void 0,
		deletingBoardOwner ? Boards.setOwner(res.locals.board._id, null) : void 0,
	]);

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Deleted staff'),
		'redirect': `/${req.params.board}/manage/staff.html`,
	});

};
