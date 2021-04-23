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

		const errors = await checkSchema([
			{ result: (enableUserBoardCreation === true), blocking: true, permLevel: 2, expected: true, error: 'User board creation is currently disabled' },
			{ result: existsBody(req.body.uri), expected: true, error: 'Missing URI' },
			{ result: lengthBody(req.body.uri, 1, globalLimits.fieldLength.uri), expected: false, error: `URI must be ${globalLimits.fieldLength.uri} characters or less` },
			{ result: existsBody(req.body.name), expected: true, error: 'Missing name' },
			{ result: lengthBody(req.body.name, 1, globalLimits.fieldLength.boardname), expected: false, error: `Name must be ${globalLimits.fieldLength.boardname} characters or less` },
			{ result: alphaNumericRegex.test(req.body.uri), expected: true, error: 'URI must contain a-z 0-9 only' },
			{ result: existsBody(req.body.description), expected: true, error: `Description must be ${globalLimits.fieldLength.description} characters or less` },
		], res.locals.permLevel);

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
