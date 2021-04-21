'use strict';

const { ObjectId } = require(__dirname+'/../db/db.js')
	, timeFieldRegex = /^(?<YEAR>[\d]+y)?(?<MONTH>[\d]+mo)?(?<WEEK>[\d]+w)?(?<DAY>[\d]+d)?(?<HOUR>[\d]+h)?(?<MINUTE>[\d]+m)?(?<SECOND>[\d]+s)?$/
	, timeUtils = require(__dirname+'/timeutils.js')
	, dynamicResponse = require(__dirname+'/dynamic.js')
	, makeArrayIfSingle = (obj) => !Array.isArray(obj) ? [obj] : obj;

/*
	, allowedArrays = new Set(['captcha', 'checkedcustompages', 'checkednews', 'checkedposts', 'globalcheckedposts', 'spoiler', 'strip_filename',
		'checkedreports', 'checkedbans', 'checkedbanners', 'checkedaccounts', 'checkedflags', 'countries'])
	, trimFields = ['allowed_hosts', 'dnsbl_blacklists', 'other_mime_types', 'highlight_options_language_subset', 'themes', 'code_themes',
		'global_limits_custom_css_filters', 'board_defaults_filters', 'filters', 'tags', 'uri', 'moderators', 'announcement', 'description', 'message',
		'name', 'subject', 'email', 'postpassword', 'password', 'default_name', 'report_reason', 'ban_reason', 'log_message', 'custom_css'] //trim if we dont want filed with whitespace
	, numberFields = ['sticky', 'lock_reset', 'captcha_reset', 'filter_mode', 'lock_mode', 'message_r9k_mode', 'file_r9k_mode', 'captcha_mode',
		'tph_trigger', 'pph_trigger', 'pph_trigger_action', 'tph_trigger_action', 'bump_limit', 'reply_limit', 'move_to_thread', 'postId',
		'max_files', 'thread_limit', 'thread', 'max_thread_message_length', 'max_reply_message_length', 'min_thread_message_length', 'min_reply_message_length', 'auth_level',
		'captcha_options_generate_limit', 'captcha_options_grid_size',  'captcha_options_image_size', 'captcha_options_num_distorts_min', 'captcha_options_num_distorts_max',
		'captcha_options_distortion', 'captcha_options_grid_icon_y_offset', '', 'flood_timers_same_content_same_ip',
		'flood_timers_same_content_any_ip', 'flood_timers_any_content_same_ip', 'block_bypass_expire_after_uses', 'ip_hash_perm_level',
		'delete_board_perm_level', 'rate_limit_cost_captcha', 'rate_limit_cost_board_settings', 'rate_limit_cost_edit_post', 'overboard_limit', 'overboard_catalog_limit',
		'lock_wait', 'prune_modlogs', 'prune_ips', 'thumb_size', 'video_thumb_percentage', 'quote_limit', 'preview_replies', 'sticky_preview_replies',
		'early_404_fraction', 'early_404_replies', 'max_recent_news', 'highlight_options_threshold', 'global_limits_thread_limit_min', 'global_limits_thread_limit_max',
		'global_limits_reply_limit_min', 'global_limits_reply_limit_max', 'global_limits_bump_limit_min', 'global_limits_bump_limit_max', 'global_limits_post_files_max',
		'global_limits_post_files_size_max', 'global_limits_banner_files_width', 'global_limits_banner_files_height',
		'global_limits_banner_files_max', 'global_limits_banner_files_total', 'global_limits_banner_files_size_max', 'global_limits_flag_files_max',
		'global_limits_flag_files_total', 'global_limits_flag_files_size_max', 'global_limits_field_length_name', 'global_limits_field_length_email',
		'global_limits_field_length_subject', 'global_limits_field_length_postpassword', 'global_limits_field_length_message', 'global_limits_field_length_report_reason',
		'global_limits_field_length_ban_reason', 'global_limits_field_length_log_message', 'global_limits_field_length_uri', 'global_limits_field_length_boardname',
		'global_limits_field_length_description', 'global_limits_multi_input_posts_anon', 'global_limits_multi_input_posts_staff', 'global_limits_custom_css_max',
		'global_limits_custom_pages_max', 'global_limits_custom_pages_max_length', 'frontend_script_default_volume', 'board_defaults_lock_mode',
		'board_defaults_file_r9k_mode', 'board_defaults_message_r9k_mode', 'board_defaults_captcha_mode', 'board_defaults_tph_trigger', 'board_defaults_pph_trigger',
		'board_defaults_tph_trigger_action', 'board_defaults_pph_trigger_action', 'board_defaults_captcha_reset', 'board_defaults_lock_reset', 'board_defaults_thread_limit',
		'board_defaults_reply_limit', 'board_defaults_bump_limit', 'board_defaults_max_files', 'board_defaults_min_thread_message_length',
		'board_defaults_min_reply_message_length', 'board_defaults_max_thread_message_length', 'board_defaults_max_reply_message_length', 'board_defaults_filter_mode',
		'perm_levels_markdown_pink', 'perm_levels_markdown_green', 'perm_levels_markdown_bold', 'perm_levels_markdown_underline', 'perm_levels_markdown_strike',
		'perm_levels_markdown_italic', 'perm_levels_markdown_title', 'perm_levels_markdown_spoiler', 'perm_levels_markdown_mono', 'perm_levels_markdown_code',
		'perm_levels_markdown_link', 'perm_levels_markdown_detected', 'perm_levels_markdown_dice'] //convert these to numbers before they hit our routes
	, timeFields = ['ban_duration', 'board_defaults_filter_ban_duration', 'default_ban_duration', 'block_bypass_expire_after_time', 'dnsbl_cache_time']
objectIdFields: newsid, news_id
objectIdArrays: globalcheckedposts, checkednews, checkedbans
numberArryas: checkedposts
*/

//might remove or add some to thislater
const defaultOptions = {
	timeFields: [],
	trimFields: [],
	allowedArrays: [],
	numberFields: [],
	numberArrays: [],
	objectIdFields: [],
	objectIdArrays: [],
	processThreadIdParam: false,
	processDateParam: false,
	processMessageLength: false,
};

module.exports = (options) => {

	options = { ...defaultOptions, ...options };

	return (req, res, next) => {

		const { timeFields, trimFields, allowedArrays,
				processThreadIdParam, processDateParam, processMessageLength,
				numberFields, numberArrays, objectIdFields, objectIdArrays } = options;
		/* check all body fields, body-parser prevents this array being too big, so no worry.
		   whitelist for fields that can be arrays, and convert singular of those fields to 1 length array */
		const bodyFields = Object.keys(req.body);
		for (let i = 0; i < bodyFields.length; i++) {
			const key = bodyFields[i];
			const val = req.body[key];
			if (!allowedArrays.includes(key) && Array.isArray(val)) {
				return dynamicResponse(req, res, 400, 'message', {
					'title': 'Bad request',
					'message': 'Malformed input'
				});
			} else if (allowedArrays.includes(key) && !Array.isArray(val)) {
				req.body[key] = makeArrayIfSingle(req.body[key]); //convert to arrays with single item for simpler case batch handling later
			}
		}

		//process trimFields to remove excess white space
		for (let i = 0; i < trimFields.length; i++) {
			const field = trimFields[i];
			if (req.body[field]) {
				//trimEnd() because trailing whitespace doesnt affect how a post appear and if it is all whitespace, trimEnd will get it all anyway
				req.body[field] = req.body[field].trimEnd();
			}
		}

		//convert numberFields into number
		for (let i = 0; i < numberFields.length; i++) {
			const field = numberFields[i];
			if (req.body[field] != null) {
				const num = parseInt(req.body[field], 10);
				if (Number.isSafeInteger(num)) {
					req.body[field] = num;
				} else {
					req.body[field] = null;
				}
			}
		}

		//convert timeFields duration string to time in ms
		for (let i = 0; i < timeFields.length; i++) {
			const field = timeFields[i];
			if (req.body[field] != null) {
				const matches = req.body[field].match(timeFieldRegex);
				if (matches && matches.groups) {
					const groups = matches.groups;
					let duration = 0;
					const groupKeys = Object.keys(groups);
					for (let i = 0; i < groupKeys.length; i++) {
						const key = groupKeys[i];
						if (!groups[key]) {
							continue;
						}
						const mult = +groups[key].replace(/\D+/, ''); //remove the unit
						if (Number.isSafeInteger(mult) //if the multiplier is safe int
							&& Number.isSafeInteger(mult*timeUtils[key]) //and multiplying it is safe int
							&& Number.isSafeInteger((mult*timeUtils[key])+duration)) { //and adding it to the total is safe
							duration += mult*timeUtils[key];
						}
					}
					req.body[field] = duration;
				} else {
					const num = parseInt(req.body[field], 10);
					if (Number.isSafeInteger(num)) {
						req.body[field] = num;
					} else {
						req.body[field] = null;
					}
				}
			}
		}

		//convert/map some fields to ObjectId or Number
		try {
			for (let i = 0; i < objectIdFields.length; i++) {
				const field = objectIdFields[i];
				if (req.body[field]) {
					req.body[field] = ObjectId(req.body[field]);
				}
			}
			for (let i = 0; i < objectIdArrays.length; i++) {
				const field = objectIdArrays[i];
				if (req.body[field]) {
					req.body[field] = req.body[field].map(ObjectId);
				}
			}
			for (let i = 0; i < numberArrays.length; i++) {
				const field = numberArrays[i];
				if (req.body[field]) {
					req.body[field] = req.body[field].map(Number);
				}
			}
		} catch (e) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'message': 'Malformed input'
			});
		}

		//thread id
		if (processThreadIdParam && req.params.id) {
			req.params.id = +req.params.id;
		}

		//moglog date
		if (processDateParam && req.params.date) {
			let [ month, day, year ] = req.params.date.split('-');
			month = month-1;
			const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
			if (date !== 'Invalid Date') {
				res.locals.date = { month, day, year, date };
			}
		}

		/* normalise message length check for CRLF vs just LF, because String.length depending on browser wont count CRLF as
		   2 characters, so user gets "message too long" at the right length. */
		if (processMessageLength && req.body.message) {
			res.locals.messageLength = req.body.message.replace(/\r\n/igm, '\n').length;
		}

		next();

	};

}
