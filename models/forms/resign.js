'use strict';

const { Boards, Accounts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js');

module.exports = async (req, res, next) => {

	const moderatesBoard = res.locals.user.staffBoards.includes(req.body.board);
	const ownsBoard = res.locals.user.ownedBoards.includes(req.body.board);
	if (!ownsBoard && !moderatesBoard) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'message': 'You do not own or moderate that board',
			'redirect': `/account.html`
		});
	}

	if (ownsBoard) {
		await Promise.all([
			Accounts.removeOwnedBoard(res.locals.user.username, req.body.board),
			Boards.setOwner(req.body.board, null),
			Boards.removeStaff(req.body.board, [res.locals.user.username]),
		]);
	} else if (moderatesBoard) {
		await Promise.all([
			Boards.removeStaff(req.body.board, [res.locals.user.username]),
			Accounts.removeStaffBoard([res.locals.user.username], req.body.board),
		]);
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': `Resigned from ${ownsBoard ? 'owner' : 'staff'} position on /${req.body.board}/`,
		'redirect': `/account.html`
	});

}
