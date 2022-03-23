'use strict';

const { Boards } = require(__dirname+'/../../db/')
	, deleteBoard = require(__dirname+'/../../models/forms/deleteboard.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, alphaNumericRegex = require(__dirname+'/../../helpers/checks/alphanumregex.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['uri'],
	}),

	controller: async (req, res, next) => {

		let board = null;
		const errors = await checkSchema([
			{ result: existsBody(req.body.confirm), expected: true, error: 'Missing confirmation' },
			{ result: existsBody(req.body.uri), expected: true, error: 'Missing URI' },
			{ result: alphaNumericRegex.test(req.body.uri), blocking: true, expected: true, error: 'URI must contain a-z 0-9 only'},
			{ result: req.params.board == null || (req.params.board === req.body.uri), expected: true, error: 'URI does not match current board' },
			{ result: async () => {
				board = await Boards.findOne(req.body.uri);
				return board != null;
			}, expected: true, error: `Board /${req.body.uri}/ does not exist` }
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': req.params.board ? `/${req.params.board}/manage/settings.html` : '/globalmanage/settings.html'
			});
		}

		try {
			await deleteBoard(board._id, board);
		} catch (err) {
			return next(err);
		}

		return dynamicResponse(req, res, 200, 'message', {
			'title': 'Success',
			'message': 'Board deleted',
			'redirect': req.params.board ? '/' : '/globalmanage/settings.html'
		});

	}

}
