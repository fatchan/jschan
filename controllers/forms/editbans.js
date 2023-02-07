'use strict';

const config = require(__dirname+'/../../lib/misc/config.js')
	, removeBans = require(__dirname+'/../../models/forms/removebans.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, denyAppeals = require(__dirname+'/../../models/forms/denybanappeals.js')
	, editBanDuration = require(__dirname+'/../../models/forms/editbanduration.js')
	, editBanNote = require(__dirname+'/../../models/forms/editbannote.js')
	, upgradeBans = require(__dirname+'/../../models/forms/upgradebans.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, inArrayBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		timeFields: ['ban_duration'],
		numberFields: ['upgrade'],
		trimFields: ['option', 'ban_note'],
		allowedArrays: ['checkedbans'],
		objectIdArrays: ['checkedbans']
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const { globalLimits } = config.get;

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedbans, 1), expected: false, error: __('Must select at least one ban') },
			{ result: inArrayBody(req.body.option, ['unban', 'edit_duration', 'edit_note', 'upgrade', 'deny_appeal']), expected: true, error: __('Invalid ban action') },
			{ result: req.body.option !== 'edit_duration' || numberBody(req.body.ban_duration, 1), expected: true, error: __('Invalid ban duration') },
			{ result: req.body.option !== 'edit_note' || !lengthBody(req.body.ban_note, 1, globalLimits.fieldLength.log_message), expected: true, error: __('Ban note must be %s characters or less', globalLimits.fieldLength.log_message) },
			{ result: req.body.option !== 'upgrade' || inArrayBody(req.body.upgrade, [1, 2]), expected: true, error: __('Invalid ban upgrade option') },
		]);

		const redirect = req.params.board ? `/${req.params.board}/manage/bans.html` : '/globalmanage/bans.html';

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
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
					message = __('Removed %s bans', amount);
					break;
				case 'deny_appeal':
					amount = await denyAppeals(req, res, next);
					message = __('Denied %s appeals', amount);
					break;
				case 'upgrade':
					amount = await upgradeBans(req, res, next);
					message = __('Upgraded %s bans', amount);
					break;
				case 'edit_duration':
					amount = await editBanDuration(req, res, next);
					message = __('Edited duration for %s bans', amount);
					break;
				case 'edit_note':
					amount = await editBanNote(req, res, next);
					message = __('Edited note for %s bans', amount);
					break;
				default:
					throw __('Invalid ban action'); //should never happen anyway
			}
		} catch (err) {
			return next(err);
		}

		return dynamicResponse(req, res, 200, 'message', {
			'title': __('Success'),
			message,
			redirect
		});

	}

};
