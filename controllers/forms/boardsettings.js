'use strict';

const changeBoardSettings = require(__dirname+'/../../models/forms/changeboardsettings.js')
	, { themes, codeThemes } = require(__dirname+'/../../helpers/themes.js')
	, { Ratelimits } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { globalLimits, rateLimitCost } = require(__dirname+'/../../configs/main.js');

module.exports = async (req, res, next) => {

	const errors = [];

//TODO: add helpers for different checks, passing name, min/max and return true with error if hit
	if (req.body.description && (req.body.description.length < 1 || req.body.description.length > 50)) {
		errors.push('Board description must be 1-50 characters');
	}
	if (req.body.announcements && (req.body.announcements.length < 1 || req.body.announcements.length > 2000)) {
		errors.push('Board announcements must be 1-2000 characters');
	}
	if (req.body.tags && req.body.tags.length > 2000) {
		errors.push('Tags length must be 2000 characters or less');
	}
	if (req.body.filters && req.body.filters.length > 2000) {
		errors.push('Filters length must be 2000 characters or less');
	}
	if (req.body.custom_css && globalLimits.customCss.enabled) {
		if (res.locals.permLevel > 1 && globalLimits.customCss.strict && globalLimits.customCss.filters.some(filter => req.body.custom_css.includes(filter))) {
			errors.push(`Custom CSS strict mode is enabled and does not allow the following: "${globalLimits.customCss.filters.join('", "')}"`);
		}
		if (req.body.custom_css.length > globalLimits.customCss.max) {
			errors.push(`Custom CSS must be ${globalLimits.customCss.max} characters or less`);
		}
	}
	if (req.body.moderators && req.body.moderators.length > 500) {
		errors.push('Moderators length must be 500 characters orless');
	}
	if (req.body.name && (req.body.name.length < 1 || req.body.name.length > 50)) {
		errors.push('Board name must be 1-50 characters');
	}
	if (req.body.default_name && (req.body.default_name.length < 1 || req.body.default_name.length > 50)) {
		errors.push('Anon name must be 1-50 characters');
	}
	if (typeof req.body.reply_limit === 'number'
		&& (req.body.reply_limit < globalLimits.replyLimit.min
			|| req.body.reply_limit > globalLimits.replyLimit.max)) {
		errors.push(`Reply Limit must be ${globalLimits.replyLimit.min}-${globalLimits.replyLimit.max}`);
	}
	if (typeof req.body.bump_limit === 'number'
		&& (req.body.bump_limit < globalLimits.bumpLimit.min
			|| req.body.bump_limit > globalLimits.bumpLimit.max)) {
		errors.push(`Bump Limit must be ${globalLimits.bumpLimit.min}-${globalLimits.bumpLimit.max}`);
	}
	if (typeof req.body.thread_limit === 'number'
		&& (req.body.thread_limit < globalLimits.threadLimit.min
			|| req.body.thread_limit > globalLimits.threadLimit.max)) {
		errors.push(`Threads Limit must be ${globalLimits.threadLimit.min}-${globalLimits.threadLimit.max}`);
	}
	if (typeof req.body.max_files === 'number' && (req.body.max_files < 0 || req.body.max_files > globalLimits.postFiles.max)) {
		errors.push(`Max files must be 0-${globalLimits.postFiles.max}`);
	}

	//make sure new min/max message dont conflict
	if (typeof req.body.min_thread_message_length === 'number'
		&& typeof req.body.max_thread_message_length === 'number'
		&& req.body.min_thread_message_length
		&& req.body.max_thread_message_length
		&& req.body.min_thread_message_length > req.body.max_thread_message_length) {
		errors.push('Min and max thread message lengths must not violate eachother');
	}
	if (typeof req.body.min_reply_message_length === 'number'
		&& typeof req.body.max_reply_message_length === 'number'
		&& req.body.min_reply_message_length > req.body.max_reply_message_length) {
		errors.push('Min and max reply message lengths must not violate eachother');
	}

	//make sure existing min/max message dont conflict
	const minThread = Math.min(globalLimits.fieldLength.message, res.locals.board.settings.maxThreadMessageLength) || globalLimits.fieldLength.message;
	if (typeof req.body.min_thread_message_length === 'number'
		&& (req.body.min_thread_message_length < 0
			|| req.body.min_thread_message_length > minThread)) {
		errors.push(`Min thread message length must be 0-${globalLimits.fieldLength.message} and not more than "Max Thread Message Length" (currently ${res.locals.board.settings.maxThreadMessageLength})`);
	}
	const minReply = Math.min(globalLimits.fieldLength.message, res.locals.board.settings.maxReplyMessageLength) || globalLimits.fieldLength.message;
	if (typeof req.body.min_reply_message_length === 'number'
		&& (req.body.min_reply_message_length < 0
			|| req.body.min_reply_message_length > minReply)) {
		errors.push(`Min reply message length must be 0-${globalLimits.fieldLength.message} and not more than "Max Reply Message Length" (currently ${res.locals.board.settings.maxReplyMessageLength})`);
	}
	if (typeof req.body.max_thread_message_length === 'number'
		&& (req.body.max_thread_message_length < 0
			|| req.body.max_thread_message_length > globalLimits.fieldLength.message
			|| (req.body.max_thread_message_length
				&& req.body.max_thread_message_length < res.locals.board.settings.minThreadMessageLength))) {
		errors.push(`Max thread message length must be 0-${globalLimits.fieldLength.message} and not less than "Min Thread Message Length" (currently ${res.locals.board.settings.minThreadMessageLength})`);
	}
	if (typeof req.body.max_reply_message_length === 'number'
		&& (req.body.max_reply_message_length < 0
			|| req.body.max_reply_message_length > globalLimits.fieldLength.message
			|| (req.body.max_reply_message_length
				&& req.body.max_reply_message_length < res.locals.board.settings.minReplyMessageLength))) {
		errors.push(`Max reply message length must be 0-${globalLimits.fieldLength.message} and not less than "Min Reply Message Length" (currently ${res.locals.board.settings.minReplyMessageLength})`);
	}

	if (typeof req.body.lock_mode === 'number' && (req.body.lock_mode < 0 || req.body.lock_mode > 2)) {
		errors.push('Invalid lock mode');
	}
	if (typeof req.body.captcha_mode === 'number' && (req.body.captcha_mode < 0 || req.body.captcha_mode > 2)) {
		errors.push('Invalid captcha mode');
	}
	if (typeof req.body.tph_trigger === 'number' && (req.body.tph_trigger < 0 || req.body.tph_trigger > 10000)) {
		errors.push('Invalid tph trigger threshold');
	}
	if (typeof req.body.tph_trigger_action === 'number' && (req.body.tph_trigger_action < 0 || req.body.tph_trigger_action > 4)) {
		errors.push('Invalid tph trigger action');
	}
	if (typeof req.body.filter_mode === 'number' && (req.body.filter_mode < 0 || req.body.filter_mode > 2)) {
		errors.push('Invalid filter mode');
	}
	if (typeof req.body.ban_duration === 'number' && req.body.ban_duration <= 0) {
		errors.push('Invalid filter auto ban duration');
	}
	if (req.body.theme && !themes.includes(req.body.theme)) {
		errors.push('Invalid theme');
	}
	if (req.body.code_theme && !codeThemes.includes(req.body.code_theme)) {
		errors.push('Invalid code theme');
	}

	if (errors.length > 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/manage/settings.html`
		});
	}

	if (res.locals.permLevel > 1) { //if not global staff or above
		const ratelimitBoard = await Ratelimits.incrmentQuota(req.params.board, 'settings', rateLimitCost.boardSettings); //2 changes a minute
//		const ratelimitIp = await Ratelimits.incrmentQuota(res.locals.ip.single, 'settings', rateLimitCost.boardSettings);
		if (ratelimitBoard > 100 /* || ratelimitIp > 100 */) {
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
