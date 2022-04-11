'use strict';

const appealBans = require(__dirname+'/../../models/forms/appeal.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, { Bans } = require(__dirname+'/../../db')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['message'],
		allowedArrays: ['checkedbans'],
		processMessageLength: true,
		objectIdArrays: ['checkedbans']
	}),

	controller: async (req, res, next) => {

		const { globalLimits } = config.get;

		const errors = await checkSchema([
			{ result: existsBody(req.body.message), expected: true, error: 'Appeals must include a message' },
			{ result: existsBody(req.body.checkedbans), expected: true, error: 'Must select at least one ban to appeal' },
			{ result: numberBody(res.locals.messageLength, 0, globalLimits.fieldLength.message), expected: true, error: `Appeal message must be ${globalLimits.fieldLength.message} characters or less` },
		]); //should appeals really be based off message field length global limit? minor.

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': '/'
			});
		}

		let amount = 0;
		try {
			amount = await appealBans(req, res, next);
		} catch (err) {
			return next(err);
		}

		if (amount === 0) {
			/* this can occur if they selected invalid id, non-ip match, already appealed, or unappealable bans. prevented by databse filter, so we use
				use the updatedCount return value to check if any appeals were made successfully. if not, we end up here. */
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'error': 'Invalid bans selected',
				'redirect': '/'
			});
		}

		return dynamicResponse(req, res, 200, 'message', {
			'title': 'Success',
			'message': `Appealed ${amount} bans successfully`,
			'redirect': '/'
		});

	}

}
