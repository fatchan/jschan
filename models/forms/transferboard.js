'use strict';

const { Boards, Accounts } = require(__dirname+'/../../db/');

module.exports = async (req, res, next) => {

	const newOwner = await Accounts.findOne(req.body.username);

	if (!newOwner) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'message': 'Cannot transfer to account that does not exist',
			'redirect': redirect
		});
	}

	//set owner in memory and in db
	res.locals.board.owner = newOwner._id;
	await Boards.setOwner(req.params.board, res.locals.board.owner);

	return res.render('message', {
		'title': 'Success',
		'message': 'Transferred ownership',
		'redirect': `/${req.params.board}/index.html`
	});

}
