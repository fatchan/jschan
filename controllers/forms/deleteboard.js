'use strict';

const { Boards } = require(__dirname+'/../../db/')
	, deleteBoard = require(__dirname+'/../../models/forms/deleteboard.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { alphaNumericRegex, checkSchema, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['uri'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		let board = null;
		const errors = await checkSchema([
			{ result: existsBody(req.body.confirm), expected: true, error: __('Missing confirmation') },
			{ result: existsBody(req.body.uri), expected: true, error: __('Missing URI') },
			{ result: alphaNumericRegex.test(req.body.uri), blocking: true, expected: true, error: __('URI must contain a-z 0-9 only') },
			{ result: req.params.board == null || (req.params.board === req.body.uri), expected: true, error: __('URI does not match current board') },
			{ result: async () => {
				board = await Boards.findOne(req.body.uri);
				return board != null;
			}, expected: true, error: __('Board /%s/ does not exist', req.body.uri) }
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
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
			'title': __('Success'),
			'message': __('Board deleted'),
			'redirect': req.params.board ? '/' : '/globalmanage/settings.html'
		});

	}

};
