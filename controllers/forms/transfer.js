'use strict';

const transferBoard = require(__dirname+'/../../models/forms/transferboard.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, alphaNumericRegex = require(__dirname+'/../../helpers/checks/alphanumregex.js');

module.exports = async (req, res, next) => {

	const errors = [];

	if (!req.body.username || req.body.username.length === 0) {
		errors.push('Missing transfer username');
	}
	if (req.body.username && req.body.username.length > 50) {
		errors.push('Transfer username must be 50 characters or less');
	}
	if (req.body.username === res.locals.board.owner) {
		errors.push('New owner username must not be same as old owner');
	}
	if (alphaNumericRegex.test(req.body.username) !== true) {
        errors.push('Username must contain a-z 0-9 only');
    }

	if (errors.length > 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/manage/settings.html`
		});
	}

	try {
		await transferBoard(req, res, next);
	} catch (err) {
		return next(err);
	}

}
