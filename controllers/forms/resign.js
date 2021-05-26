'use strict';

const { Boards } = require(__dirname+'/../../db/')
	, resignFromBoard = require(__dirname+'/../../models/forms/resign.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, alphaNumericRegex = require(__dirname+'/../../helpers/checks/alphanumregex.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

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
				'redirect': `/account.html`
			})
		}

		try {
			await resignFromBoard(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
