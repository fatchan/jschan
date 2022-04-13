'use strict';

const removeBans = require(__dirname+'/../../models/forms/removebans.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, denyAppeals = require(__dirname+'/../../models/forms/denybanappeals.js')
	, editBans = require(__dirname+'/../../models/forms/editbans.js')
	, upgradeBans = require(__dirname+'/../../models/forms/upgradebans.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		timeFields: ['ban_duration'],
		numberFields: ['upgrade'],
		trimFields: ['option'],
		allowedArrays: ['checkedbans'],
		objectIdArrays: ['checkedbans']
	}),

	controller: async (req, res, next) => {

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedbans, 1), expected: false, error: 'Must select at least one ban' },
			{ result: inArrayBody(req.body.option, ['unban', 'edit', 'upgrade', 'deny_appeal']), expected: true, error: 'Invalid ban action' },
			{ result: req.body.option !== 'edit' || numberBody(req.body.ban_duration, 1), expected: true, error: 'Invalid ban duration' },
			{ result: req.body.option !== 'upgrade' || inArrayBody(req.body.upgrade, [1, 2]), expected: true, error: 'Invalid ban upgrade option' },
		]);

		const redirect = req.params.board ? `/${req.params.board}/manage/bans.html` : '/globalmanage/bans.html';

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				redirect
			});
		}

		let amount = 0;
		let message;
		try {
			switch(req.body.option) {
				case 'unban':
					amount = await removeBans(req, res, next);
					message = `Removed ${amount} bans`;
					break;
				case 'deny_appeal':
					amount = await denyAppeals(req, res, next);
					message = `Denied ${amount} appeals`;
					break;
				case 'upgrade':
					amount = await upgradeBans(req, res, next);
					message = `Upgraded ${amount} bans`;
					break;
				case 'edit': //could do other properties in future
					amount = await editBans(req, res, next);
					message = `Edited ${amount} bans`;
					break;
				default:
					throw 'Invalid ban action'; //should never happen anyway
			}
		} catch (err) {
			return next(err);
		}

		return dynamicResponse(req, res, 200, 'message', {
			'title': 'Success',
			message,
			redirect
		});

	}

}
