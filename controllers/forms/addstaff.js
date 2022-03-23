'use strict';

const addStaff = require(__dirname+'/../../models/forms/addstaff.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, config = require(__dirname+'/../../config.js')
	, { Accounts } = require(__dirname+'/../../db/')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['username'],
	}),

	controller: async (req, res, next) => {

		const { globalLimits } = config.get;

		const errors = await checkSchema([
			{ result: existsBody(req.body.username), expected: true, error: 'Missing staff username' },
			{ result: lengthBody(req.body.username, 0, 50), expected: false, error: 'Username must be 50 characters or less' },
			{ result: (res.locals.board.owner === req.body.username), expected: false, blocking: true, error: 'User is already board owner' },
			{ result: (res.locals.board.staff[req.body.username] != null), expected: false, blocking: true, error: 'User is already staff' },
			{ result: async () => {
				const numAccounts = await Accounts.countUsers([req.body.username]);
				return numAccounts > 0;
			}, expected: true, error: 'User does not exist' },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
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

}
