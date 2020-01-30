'use strict';

const { Boards, Accounts } = require(__dirname+'/../../db/');

module.exports = async (req, res, next) => {

	const newOwner = await Accounts.findOne(req.body.username.toLowerCase());

	if (!newOwner) {
		return res.status(400).render('message', {
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

	return res.render('message', {
		'title': 'Success',
		'message': 'Transferred ownership',
		'redirect': `/${req.params.board}/index.html`
	});

}
