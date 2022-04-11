'use strict';

const changeBoardSettings = require(__dirname+'/../../models/forms/changeboardsettings.js')
	, Permissions = require(__dirname+'/../../lib/permission/permissions.js')
	, { themes, codeThemes } = require(__dirname+'/../../lib/misc/themes.js')
	, { Ratelimits } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody, numberBodyVariable,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		timeFields: ['ban_duration', 'delete_protection_age'],
		trimFields: ['filters', 'moderators', 'tags', 'announcement', 'description', 'name', 'custom_css'],
		allowedArrays: ['countries'],
		numberFields: ['lock_reset', 'captcha_reset', 'filter_mode', 'lock_mode', 'message_r9k_mode', 'file_r9k_mode', 'captcha_mode', 'tph_trigger', 'pph_trigger', 'pph_trigger_action',
			'tph_trigger_action', 'bump_limit', 'reply_limit', 'max_files', 'thread_limit', 'max_thread_message_length', 'max_reply_message_length', 'min_thread_message_length',
			'min_reply_message_length', 'delete_protection_count'],
	}),

	controller: async (req, res, next) => {

		const { globalLimits, rateLimitCost } = config.get
			, maxThread = (Math.min(globalLimits.fieldLength.message, res.locals.board.settings.maxThreadMessageLength) || globalLimits.fieldLength.message)
			, maxReply = (Math.min(globalLimits.fieldLength.message, res.locals.board.settings.maxReplyMessageLength) || globalLimits.fieldLength.message);

		const errors = await checkSchema([
			{ result: lengthBody(req.body.description, 0, globalLimits.fieldLength.description), expected: false, error: `Board description must be ${globalLimits.fieldLength.description} characters or less` },
			{ result: lengthBody(req.body.announcements, 0, 5000), expected: false, error: 'Board announcements must be 5000 characters or less' },
			{ result: lengthBody(req.body.tags, 0, 2000), expected: false, error: 'Tags length must be 2000 characters or less' },
			{ result: lengthBody(req.body.filters, 0, 20000), expected: false, error: 'Filters length must be 20000 characters or less' },
			{ result: lengthBody(req.body.custom_css, 0, globalLimits.customCss.max), expected: false, error: `Custom CSS must be ${globalLimits.customCss.max} characters or less` },
			{ result: arrayInBody(globalLimits.customCss.filters, req.body.custom_css), permission: Permissions.ROOT, expected: false, error: `Custom CSS strict mode is enabled and does not allow the following: "${globalLimits.customCss.filters.join('", "')}"` },
			{ result: lengthBody(req.body.moderators, 0, 500), expected: false, error: 'Moderators length must be 500 characters orless' },
			{ result: lengthBody(req.body.name, 1, globalLimits.fieldLength.boardname), expected: false, error: `Board name must be 1-${globalLimits.fieldLength.boardname} characters` },
			{ result: lengthBody(req.body.default_name, 0, 50), expected: false, error: 'Anon name must be 50 characters or less' },
			{ result: numberBody(req.body.reply_limit, globalLimits.replyLimit.min, globalLimits.replyLimit.max), expected: true, error: `Reply Limit must be ${globalLimits.replyLimit.min}-${globalLimits.replyLimit.max}` },
			{ result: numberBody(req.body.bump_limit, globalLimits.bumpLimit.min, globalLimits.bumpLimit.max), expected: true, error: `Bump Limit must be ${globalLimits.bumpLimit.min}-${globalLimits.bumpLimit.max}` },
			{ result: numberBody(req.body.thread_limit, globalLimits.threadLimit.min, globalLimits.threadLimit.max), expected: true, error: `Threads Limit must be ${globalLimits.threadLimit.min}-${globalLimits.threadLimit.max}` },
			{ result: numberBody(req.body.max_files, 0, globalLimits.postFiles.max), expected: true, error: `Max files must be 0-${globalLimits.postFiles.max}` },
			{ result: numberBody(req.body.min_thread_message_length, 0, globalLimits.fieldLength.message), expected: true, error: `Min thread message length must be 0-${globalLimits.fieldLength.message}` },
			{ result: numberBody(req.body.min_reply_message_length, 0, globalLimits.fieldLength.message), expected: true, error: `Min reply message length must be 0-${globalLimits.fieldLength.message}` },
			{ result: numberBody(req.body.max_thread_message_length, 0, globalLimits.fieldLength.message), expected: true, error: `Max thread message length must be 0-${globalLimits.fieldLength.message}` },
			{ result: numberBody(req.body.max_reply_message_length, 0, globalLimits.fieldLength.message), expected: true, error: `Max reply message length must be 0-${globalLimits.fieldLength.message}` },
			{ result: minmaxBody(req.body.min_thread_message_length, req.body.max_thread_message_length), expected: true, error: 'Min and max thread message lengths must not violate eachother' },
			{ result: minmaxBody(req.body.min_reply_message_length, req.body.max_reply_message_length), expected: true, error: 'Min and max reply message lengths must not violate eachother' },
			{ result: numberBodyVariable(req.body.min_thread_message_length, res.locals.board.settings.minThreadMessageLength,
				req.body.min_thread_message_length, maxThread, req.body.max_thread_message_length), expected: true,
				error: `Min thread message length must be 0-${globalLimits.fieldLength.message} and not more than "Max Thread Message Length" (currently ${res.locals.board.settings.maxThreadMessageLength})` },
			{ result: numberBodyVariable(req.body.min_reply_message_length, res.locals.board.settings.minReplyMessageLength,
				req.body.min_reply_message_length, maxReply, req.body.max_reply_message_length), expected: true,
				error: `Min reply message length must be 0-${globalLimits.fieldLength.message} and not more than "Max Reply Message Length" (currently ${res.locals.board.settings.maxReplyMessageLength})` },
			{ result: numberBodyVariable(req.body.max_thread_message_length, res.locals.board.settings.minThreadMessageLength,
				req.body.min_thread_message_length, globalLimits.fieldLength.message, globalLimits.fieldLength.message), expected: true,
				error: `Max thread message length must be 0-${globalLimits.fieldLength.message} and not less than "Min Thread Message Length" (currently ${res.locals.board.settings.minThreadMessageLength})` },
			{ result: numberBodyVariable(req.body.max_reply_message_length, res.locals.board.settings.minReplyMessageLength,
				req.body.min_reply_message_length, globalLimits.fieldLength.message, globalLimits.fieldLength.message), expected: true,
				error: `Max reply message length must be 0-${globalLimits.fieldLength.message} and not less than "Min Reply Message Length" (currently ${res.locals.board.settings.minReplyMessageLength})` },
			{ result: numberBody(req.body.lock_mode, 0, 2), expected: true, error: 'Invalid lock mode' },
			{ result: numberBody(req.body.captcha_mode, 0, 2), expected: true, error: 'Invalid captcha mode' },
			{ result: numberBody(req.body.filter_mode, 0, 2), expected: true, error: 'Invalid filter mode' },
			{ result: numberBody(req.body.tph_trigger, 0, 10000), expected: true, error: 'Invalid tph trigger threshold' },
			{ result: numberBody(req.body.tph_trigger_action, 0, 4), expected: true, error: 'Invalid tph trigger action' },
			{ result: numberBody(req.body.pph_trigger, 0, 10000), expected: true, error: 'Invalid pph trigger threshold' },
			{ result: numberBody(req.body.pph_trigger_action, 0, 4), expected: true, error: 'Invalid pph trigger action' },
			{ result: numberBody(req.body.lock_reset, 0, 2), expected: true, error: 'Invalid trigger reset lock' },
			{ result: numberBody(req.body.captcha_reset, 0, 2), expected: true, error: 'Invalid trigger reset captcha' },
			{ result: numberBody(req.body.ban_duration, 0), expected: true, error: 'Invalid filter auto ban duration' },
			{ result: numberBody(req.body.delete_protection_age, 0), expected: true, error: 'Invalid OP thread age delete protection' },
			{ result: numberBody(req.body.delete_protection_count, 0), expected: true, error: 'Invalid OP thread reply count delete protection' },
			{ result: inArrayBody(req.body.theme, themes), expected: true, error: 'Invalid theme' },
			{ result: inArrayBody(req.body.code_theme, codeThemes), expected: true, error: 'Invalid code theme' },
		], res.locals.permissions);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': `/${req.params.board}/manage/settings.html`
			});
		}

		if (!res.locals.permissions.get(Permissions.BYPASS_RATELIMITS)) {
			const ratelimitBoard = await Ratelimits.incrmentQuota(req.params.board, 'settings', rateLimitCost.boardSettings); //2 changes a minute
			const ratelimitIp = res.locals.anonymizer ? 0 : (await Ratelimits.incrmentQuota(res.locals.ip.cloak, 'settings', rateLimitCost.boardSettings));
			if (ratelimitBoard > 100 || ratelimitIp > 100) {
				return dynamicResponse(req, res, 429, 'message', {
					'title': 'Ratelimited',
					'error': 'You are changing settings too quickly, please wait a minute and try again',
					'redirect': `/${req.params.board}/manage/settings.html`
				});
			}
		}

		try {
			await changeBoardSettings(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

}
