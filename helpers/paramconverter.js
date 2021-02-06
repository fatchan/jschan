'use strict';

const { ObjectId } = require(__dirname+'/../db/db.js')
	//todo: separate these into a schema/set for differ ent routes and inject it before the controller, to prevent checkign a bunch of other shit for every post
	, allowedArrays = new Set(['captcha', 'checkedcustompages', 'checkednews', 'checkedposts', 'globalcheckedposts', 'spoiler', 'strip_filename',
		'checkedreports', 'checkedbans', 'checkedbanners', 'checkedaccounts', 'countries'])
	, trimFields = ['allowed_hosts', 'dnsbl_blacklists', 'other_mime_types', 'highlight_options_language_subset', 'themes', 'code_themes',
		'global_limits_custom_css_filters', 'board_defaults_filters', 'filters', 'tags', 'uri', 'moderators', 'announcement', 'description', 'message',
		'name', 'subject', 'email', 'postpassword', 'password', 'default_name', 'report_reason', 'ban_reason', 'log_message', 'custom_css'] //trim if we dont want filed with whitespace
	, numberFields = ['sticky', 'lock_reset', 'captcha_reset', 'filter_mode', 'lock_mode', 'message_r9k_mode', 'file_r9k_mode', 'captcha_mode',
		'tph_trigger', 'pph_trigger', 'pph_trigger_action', 'tph_trigger_action', 'bump_limit', 'reply_limit', 'move_to_thread', 'postId',
		'max_files', 'thread_limit', 'thread', 'max_thread_message_length', 'max_reply_message_length', 'min_thread_message_length', 'min_reply_message_length', 'auth_level',
		'captcha_options_num_distorts_min', 'captcha_options_num_distorts_max', 'captcha_options_distortion', 'dnsbl_cache_time', 'flood_timers_same_content_same_ip',
		'flood_timers_same_content_any_ip', 'flood_timers_any_content_same_ip', 'block_bypass_expire_after_uses', 'block_bypass_expire_after_time', 'ip_hash_perm_level',
		'delete_board_perm_level', 'rate_limit_cost_captcha', 'rate_limit_cost_board_settings', 'rate_limit_cost_edit_post', 'overboard_limit', 'overboard_catalog_limit',
		'lock_wait', 'prune_modlogs', 'thumb_size', 'video_thumb_percentage', 'default_ban_duration', 'quote_limit', 'preview_replies', 'sticky_preview_replies',
		'early_404_fraction', 'early_404_replies', 'max_recent_news', 'highlight_options_threshold', 'global_limits_thread_limit_min', 'global_limits_thread_limit_max',
		'global_limits_reply_limit_min', 'global_limits_reply_limit_max', 'global_limits_bump_limit_min', 'global_limits_bump_limit_max', 'global_limits_post_files_max',
		'global_limits_post_files_size_max', 'global_limits_banner_files_width', 'global_limits_banner_files_height', 'global_limits_banner_files_max',
		'global_alimits_banner_files_total', 'global_limits_banner_files_size_max', 'global_limits_field_length_name', 'global_limits_field_length_email',
		'global_limits_field_length_subject', 'global_limits_field_length_postpassword', 'global_limits_field_length_message', 'global_limits_field_length_report_reason',
		'global_limits_field_length_ban_reason', 'global_limits_field_length_log_message', 'global_limits_field_length_uri', 'global_limits_field_length_boardname',
		'global_limits_field_length_description', 'global_limits_multi_input_posts_anon', 'global_limits_multi_input_posts_staff', 'global_limits_custom_css_max',
		'global_limits_custom_pages_max', 'global_limits_custom_pages_max_length', 'frontend_script_default_volume', 'board_defaults_lock_mode',
		'board_defaults_file_r9k_mode', 'board_defaults_message_r9k_mode', 'board_defaults_captcha_mode', 'board_defaults_tph_trigger', 'board_defaults_pph_trigger',
		'board_defaults_tph_trigger_action', 'board_defaults_pph_trigger_action', 'board_defaults_captcha_reset', 'board_defaults_lock_reset', 'board_defaults_thread_limit',
		'board_defaults_reply_limit', 'board_defaults_bump_limit', 'board_defaults_max_files', 'board_defaults_min_thread_message_length',
		'board_defaults_min_reply_message_length', 'board_defaults_max_thread_message_length', 'board_defaults_max_reply_message_length', 'board_defaults_filter_mode',
		'board_defaults_filter_ban_duration', 'ban_duration'] //convert these to numbers before they hit our routes
	, banDurationRegex = /^(?<YEAR>[\d]+y)?(?<MONTH>[\d]+mo)?(?<WEEK>[\d]+w)?(?<DAY>[\d]+d)?(?<HOUR>[\d]+h)?(?<MINUTE>[\d]+m)?(?<SECOND>[\d]+s)?$/
	, timeUtils = require(__dirname+'/timeutils.js')
	, dynamicResponse = require(__dirname+'/dynamic.js')
	, makeArrayIfSingle = (obj) => !Array.isArray(obj) ? [obj] : obj;

module.exports = (req, res, next) => {

	const bodyfields = Object.keys(req.body);
	for (let i = 0; i < bodyfields.length; i++) {
		const key = bodyfields[i];
		const val = req.body[key];
		/*
			bodyparser can form arrays e.g. for multiple files, but we only want arrays in fields we
			expect, to prevent issues when validating/using them later on.
		*/
		if (!allowedArrays.has(key) && Array.isArray(val)) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'message': 'Malformed input'
			});
		} else if (allowedArrays.has(key) && !Array.isArray(val)) {
			req.body[key] = makeArrayIfSingle(req.body[key]); //convert to arrays with single item for simpler case batch handling later
		}
	}

	for (let i = 0; i < trimFields.length; i++) {
		const field = trimFields[i];
		if (req.body[field]) {
			//trimEnd() because trailing whitespace doesnt affect how a post appear and if it is all whitespace, trimEnd will get it all anyway
			req.body[field] = req.body[field].trimEnd();
		}
	}

	//proper length check for CRLF vs just LF, because browsers dont count CRLF as 2 characters like the server does (and like it technically is)
	if (req.body.message) {
		res.locals.messageLength = req.body.message.replace(/\r\n/igm, '\n').length;
	}

	for (let i = 0; i < numberFields.length; i++) {
		const field = numberFields[i];
		if (req.body[field] != null) {
			const num = parseInt(req.body[field]);
			if (Number.isSafeInteger(num)) {
				req.body[field] = num;
			} else {
				req.body[field] = null;
			}
		}
	}

	//convert checked reports to number
	if (req.body.checkedposts) {
		req.body.checkedposts = req.body.checkedposts.map(Number);
	}
	//convert checked global reports to mongoid
	if (req.body.globalcheckedposts) {
		req.body.globalcheckedposts = req.body.globalcheckedposts.map(ObjectId)
	}
	if (req.body.checkednews) {
		req.body.checkednews = req.body.checkednews.map(ObjectId)
	}
	//convert checked bans to mongoid
	if (req.body.checkedbans) {
		req.body.checkedbans = req.body.checkedbans.map(ObjectId)
	}
/*
	//convert checked reports to mongoid
	if (req.body.checkedreports) {
		req.body.checkedreports = req.body.checkedreports.map(ObjectId)
	}
*/

	//ban duration convert to ban time in ms
	if (req.body.ban_duration) {
		const matches = req.body.ban_duration.match(banDurationRegex);
		if (matches && matches.groups) {
			const groups = matches.groups;
			let banDuration = 0;
			const groupKeys = Object.keys(groups);
			for (let i = 0; i < groupKeys.length; i++) {
				const key = groupKeys[i];
				if (!groups[key]) {
					continue;
				}
				const mult = +groups[key].replace(/\D+/, ''); //remove the unit
				if (Number.isSafeInteger(mult) //if the multiplier is safe int
					&& Number.isSafeInteger(mult*timeUtils[key]) //and multiplying it is safe int
					&& Number.isSafeInteger((mult*timeUtils[key])+banDuration)) { //and adding it to the total is safe
					banDuration += mult*timeUtils[key];
				}
			}
			req.body.ban_duration = banDuration;
		} else {
			req.body.ban_duration = null;
		}
	}

	//ids for newspost editing
	if (req.params.newsid) {
		req.params.newsid = ObjectId(req.params.newsid);
	}
	if (req.body.news_id) {
		req.body.news_id = ObjectId(req.body.news_id);
	}
	//thread id
	if (req.params.id) {
		req.params.id = +req.params.id;
	}
	//moglog date
	if (req.params.date) {
		let [ month, day, year ] = req.params.date.split('-');
		month = month-1;
		const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
		if (date !== 'Invalid Date') {
			res.locals.date = { month, day, year, date };
		}
	}

	next();

}
