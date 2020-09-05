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

	//remove owned board from current account
	await Accounts.removeOwnedBoard(res.locals.board.owner, req.params.board)

	//remove new owner as moderator if they were one
	if (res.locals.board.settings.moderators.includes(newOwner._id)) {
		await Boards.removeModerator(req.params.board, res.locals.user.username)
		await Accounts.removeModBoard([newOwner._id], req.params.board)
	}

	//set owner in memory and in db
	res.locals.board.owner = newOwner._id;
	await Boards.setOwner(req.params.board, res.locals.board.owner);
	//add ownership to new owner account
	await Accounts.addOwnedBoard(newOwner._id, req.params.board);

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Transferred ownership',
		'redirect': `/${req.params.board}/index.html`
	});

}
