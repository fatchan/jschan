'use strict';

const createBoard = require(__dirname+'/../../models/forms/create.js')
	, { enableUserBoards, globalLimits } = require(__dirname+'/../../configs/main.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, alphaNumericRegex = require(__dirname+'/../../helpers/checks/alphanumregex.js')

module.exports = async (req, res, next) => {

	if (enableUserBoards === false && res.locals.permLevel !== 0) {
		//only board admin can create boards when user board creation disabled
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'error': 'Board creation is only available to site administration',
			'redirect': '/create.html'
		});
	}

	const errors = [];

	//check exist
	if (!req.body.uri || req.body.uri.length <= 0) {
		errors.push('Missing URI');
	}
	if (!req.body.name || req.body.name.length <= 0) {
		errors.push('Missing name');
	}
	if (!req.body.description || req.body.description.length <= 0) {
		errors.push('Missing description');
	}

	//other validation
	if (req.body.uri) {
		if (req.body.uri.length > globalLimits.fieldLength.uri) {
			errors.push(`URI must be ${globalLimits.fieldLength.uri} characters or less`);
		}
		if (alphaNumericRegex.test(req.body.uri) !== true) {
			errors.push('URI must contain a-z 0-9 only');
		}
	}
	if (req.body.name && req.body.name.length > globalLimits.fieldLength.boardname) {
		errors.push(`Name must be ${globalLimits.fieldLength.boardname} characters or less`);
	}
	if (req.body.description && req.body.description.length > globalLimits.fieldLength.description) {
		errors.push(`Description must be ${globalLimits.fieldLength.description} characters or less`);
	}

	if (errors.length > 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/create.html'
		});
	}

	try {
		await createBoard(req, res, next);
	} catch (err) {
		return next(err);
	}

}
