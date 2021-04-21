'use strict';

const createBoard = require(__dirname+'/../../models/forms/create.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, config = require(__dirname+'/../../config.js')
	, alphaNumericRegex = require(__dirname+'/../../helpers/checks/alphanumregex.js')
	, paramConverter = require(__dirname+'/../../helpers/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['name', 'uri', 'description'],
	}),

	controller: async (req, res, next) => {

		const { enableUserBoardCreation, globalLimits } = config.get;

		if (enableUserBoardCreation === false && res.locals.permLevel > 1) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'error': 'User board creation is currently disabled',
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

}
