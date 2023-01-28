'use strict';

const addStaff = require(__dirname+'/../../models/forms/addstaff.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, { Accounts } = require(__dirname+'/../../db/')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['username'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const errors = await checkSchema([
			{ result: existsBody(req.body.username), expected: true, error: __('Missing staff username') },
			{ result: lengthBody(req.body.username, 0, 50), expected: false, error: __('Username must be 50 characters or less') },
			{ result: (res.locals.board.owner === req.body.username), expected: false, blocking: true, error: __('User is already board owner') },
			{ result: (res.locals.board.staff[req.body.username] != null), expected: false, blocking: true, error: __('User is already staff') },
			{ result: async () => {
				const numAccounts = await Accounts.countUsers([req.body.username]);
				return numAccounts > 0;
			}, expected: true, error: __('User does not exist') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': req.headers.referer || `/${req.params.board}/manage/staff.html`,
			});
		}

		try {
			await addStaff(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
