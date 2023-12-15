'use strict';

const deleteAccount = require(__dirname+'/../../models/forms/deleteaccount.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	//, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, numberBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	//paramConverter: paramConverter({}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const { staffBoards, ownedBoards } = res.locals.user;

		const errors = await checkSchema([
			{ result: existsBody(req.body.confirm), expected: true, error: __('Missing confirmation') },
			{ result: (numberBody(ownedBoards.length, 0, 0) && numberBody(staffBoards.length, 0, 0)), expected: true, error: __('You cannot delete your account while you hold staff position on any board') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': '/account.html',
			});
		}

		try {
			await deleteAccount(res.locals.user.username);
		} catch (err) {
			return next(err);
		}

		return dynamicResponse(req, res, 200, 'message', {
			'title': __('Success'),
			'message': __('Account deleted'),
			'redirect': '/',
		});

	}

};
