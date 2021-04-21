'use strict';

const deleteAccount = require(__dirname+'/../../models/forms/deleteaccount.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	//paramConverter: paramConverter({}),

	controller: async (req, res, next) => {

		if (!req.body.confirm) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'error': 'Missing confirmation',
				'redirect': '/account.html',
			});
		}

		const { modBoards, ownedBoards } = res.locals.user;
		if (ownedBoards.length > 0 || modBoards.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'message': 'You cannot delete your account while you hold staff position on any board',
				'redirect': '/account.html',
			});
		}

		try {
			await deleteAccount(res.locals.user.username);
		} catch (err) {
			return next(err);
		}

		return dynamicResponse(req, res, 200, 'message', {
			'title': 'Success',
			'message': 'Account deleted',
			'redirect': '/',
		});

	}

}
