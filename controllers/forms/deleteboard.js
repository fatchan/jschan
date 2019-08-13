'use strict';

const Boards = require(__dirname+'/../../db/boards.js')
	, deleteBoard = require(__dirname+'/../../models/forms/deleteboard.js')
	, boardUriRegex = require(__dirname+'/../../helpers/checks/boarduriregex.js')

module.exports = async (req, res, next) => {

	const errors = [];

	if (!req.body.confirm) {
		errors.push('Missing confirmation');
	}
	if (!req.body.uri) {
		errors.push('Missing URI');
	}
	if (boardUriRegex.test(req.body.uri) !== true) {
		errors.push('URI must contain a-z 0-9 only');
	} else {
		//no need to check these if the board name is completely invalid
		if (req.params.board != null && req.params.board !== req.body.uri) {
			//board manage page to not be able to delete other boards;
			errors.push('URI does not match current board');
		}
		let board;
		try {
			board = await Boards.findOne(req.body.uri)
		} catch (err) {
			return next(err);
		}
		if (!board) {
			//global must check exists because the route skips Boards.exists middleware
			errors.push(`Board /${req.body.uri}/ does not exist`);
		}
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': req.params.board ? `/${req.params.board}/manage.html` : '/globalmanage.html'
		});
	}

	try {
		await deleteBoard(req.body.uri);
	} catch (err) {
		return next(err);
	}

	return res.render('message', {
		'title': 'Success',
		'message': 'Board deleted',
		'redirect': req.params.board ? '/' : '/globalmanage.html'
	});

}
