'use strict';

const { Boards } = require(__dirname+'/../../db/')
	, resignFromBoard = require(__dirname+'/../../models/forms/resign.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, alphaNumericRegex = require(__dirname+'/../../lib/input/alphanumregex.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['board'],
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: existsBody(req.body.confirm), expected: true, error: 'Missing confirmation' },
			{ result: existsBody(req.body.board), expected: true, error: 'You did not select a board' },
			{ result: alphaNumericRegex.test(req.body.board), expected: true, error: 'URI must contain a-z 0-9 only' },
			{ result: async () => {
				res.locals.board = await Boards.findOne(req.body.board);
				return res.locals.board != null;
			}, expected: true, error: `Board /${req.body.board}/ does not exist` },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': '/account.html'
			});
		}

		try {
			await resignFromBoard(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
