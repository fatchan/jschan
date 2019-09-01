'use strict';

const changeBoardSettings = require(__dirname+'/../../models/forms/changeboardsettings.js')
	, themes = require(__dirname+'/../../helpers/themes.js');

module.exports = async (req, res, next) => {

	const errors = [];

	if (req.body.description && (req.body.description.length < 1 || req.body.description.length > 50)) {
		errors.push('Board description must be 1-50 characters');
	}
	if (req.body.announcements && (req.body.announcements.length < 1 || req.body.announcements.length > 2000)) {
		errors.push('Board announcements must be 1-2000 characters');
	}
	if (req.body.tags && req.body.tags.length > 2000) {
		errors.push('Tags length must be less than 2000 characters');
	}
	if (req.body.filters && req.body.filters.length > 2000) {
		errors.push('Filters length must be less than 2000 characters');
	}
	if (req.body.moderators && req.body.moderators.length > 500) {
		errors.push('Moderators length must be less than 500 characters');
	}
	if (req.body.name && (req.body.name.length < 1 || req.body.name.length > 50)) {
		errors.push('Board name must be 1-50 characters');
	}
	if (req.body.default_name && (req.body.default_name.length < 1 || req.body.default_name.length > 50)) {
		errors.push('Anon name must be 1-50 characters');
	}
	if (typeof req.body.reply_limit === 'number' && (req.body.reply_limit < 1 || req.body.reply_limit > 1000)) {
		errors.push('Reply Limit must be from 1-1000');
	}
	if (typeof req.body.thread_limit === 'number' && (req.body.thread_limit < 10 || req.body.thread_limit > 250)) {
		errors.push('Threads Limit must be 10-250');
	}
	if (typeof req.body.max_files === 'number' && (req.body.max_files < 0 || req.body.max_files > 3)) {
		errors.push('Max files must be 0-3');
	}
	if (typeof req.body.min_thread_message_length === 'number' && (req.body.min_thread_message_length < 0 || req.body.min_thread_message_length > 4000)) {
		errors.push('Min thread message length must be 0-4000. 0 is disabled.');
	}
	if (typeof req.body.min_reply_message_length === 'number' && (req.body.min_reply_message_length < 0 || req.body.min_reply_message_length > 4000)) {
		errors.push('Min reply message length must be 0-4000. 0 is disabled.');
	}
	if (typeof req.body.captcha_mode === 'number' && (req.body.captcha_mode < 0 || req.body.captcha_mode > 2)) {
		errors.push('Invalid captcha mode.');
	}
	if (typeof req.body.tph_trigger === 'number' && (req.body.tph_trigger < 0 || req.body.tph_trigger > 10000)) {
		errors.push('Invalid tph trigger threshold.');
	}
	if (typeof req.body.tph_trigger_action === 'number' && (req.body.tph_trigger_action < 0 || req.body.tph_trigger_action > 3)) {
		errors.push('Invalid tph trigger action.');
	}
	if (typeof req.body.filter_mode === 'number' && (req.body.filter_mode < 0 || req.body.filter_mode > 2)) {
		errors.push('Invalid filter mode.');
	}
	if (typeof req.body.ban_duration === 'number' && req.body.ban_duration <= 0) {
		errors.push('Invalid filter auto ban duration.');
	}
	if (req.body.theme && !themes.includes(req.body.theme)) {
		errors.push('Invalid theme');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/manage.html`
		});
	}

	try {
		await changeBoardSettings(req, res, next);
	} catch (err) {
		return next(err);
	}

}
