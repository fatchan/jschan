'use strict';

const { Boards, Accounts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js');

module.exports = async (req, res, next) => {

	await Promise.all([
		Accounts.removeStaffBoard(req.body.checkedstaff, res.locals.board._id),
		Boards.removeStaff(res.locals.board._id, req.body.checkedstaff)
	]);

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Deleted staff',
		'redirect': `/${req.params.board}/manage/staff.html`,
	});

}
