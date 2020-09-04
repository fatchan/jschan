'use strict';

const { Boards } = require(__dirname+'/../../db/')
	, resignFromBoard = require(__dirname+'/../../models/forms/resign.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, alphaNumericRegex = require(__dirname+'/../../helpers/checks/alphanumregex.js');

module.exports = async (req, res, next) => {

	const errors = [];

	if (!req.body.confirm) {
		errors.push('Missing confirmation');
	}
	if (!req.body.board || req.body.board.length === 0) {
		errors.push('You did not select a board');
	} else if (alphaNumericRegex.test(req.body.board) !== true) {
		errors.push('URI must contain a-z 0-9 only');
	} else {
		try {
			res.locals.board = await Boards.findOne(req.body.board);
		} catch (err) {
			return next(err);
		}
		if (!res.locals.board) {
			errors.push(`Board /${req.body.board}/ does not exist`);
		}
	}

	if (errors.length > 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/account.html`
		})
	}

	try {
		await resignFromBoard(req, res, next);
	} catch (err) {
		return next(err);
	}

}
