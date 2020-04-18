'use strict';

const { Boards, Accounts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js');

module.exports = async (req, res, next) => {

	const newOwner = await Accounts.findOne(req.body.username.toLowerCase());

	if (!newOwner) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'message': 'Cannot transfer to account that does not exist',
			'redirect': `/${req.params.board}/manage/settings.html`
		});
	}

	//modify accounts with new board ownership
	await Accounts.removeOwnedBoard(res.locals.board.owner, req.params.board)
	await Accounts.addOwnedBoard(newOwner._id, req.params.board);

	//set owner in memory and in db
	res.locals.board.owner = newOwner._id;
	await Boards.setOwner(req.params.board, res.locals.board.owner);

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Transferred ownership',
		'redirect': `/${req.params.board}/index.html`
	});

}
