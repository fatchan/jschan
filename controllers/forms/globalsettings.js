'use strict';

const changeGlobalSettings = require(__dirname+'/../../models/forms/changeglobalsettings.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { checkSchema, lengthBody, numberBody, minmaxBody,
		inArrayBody, arrayInBody, existsBody } = require(__dirname+'/../../helpers/schema.js');

module.exports = async (req, res, next) => {

/*
{
	result: <check function, either predefined, some other check like isAlphaNumeric, or a custom callback>,
	expected: <true or false>
	error: <error text>,
	permLevel: [optional perm level],
}
*/

	//not declared at topf of file because getConfig() values could change, so maybe a lil slower.
	//at some point in future the schemas can stored in a common place and updated along with config in redis sub 
	const schema = [
		{ result: lengthBody(req.body.filters, 0, 5000), expected: false, error: 'Filter text cannot exceed 5000 characters' },
		{ result: numberBody(req.body.filter_mode, 0, 2), expected: false, error: 'Filter mode must be a number from 0-2' },
		{ result: numberBody(req.body.ban_duration), expected: false, error: 'Invalid filter auto ban duration' },
		{ result: lengthBody(req.body.allowed_hosts, 0, 100), expected: false, error: 'Allowed hosts must not exceed 100 entries' },
		{ result: lengthBody(req.body.country_code_header, 0, 100), expected: false, error: 'Country code header length must not exceed 100 characters' },
		{ result: lengthBody(req.body.ip_header, 0, 100), expected: false, error: 'IP header length must not exceed 100 characters' },
		{ result: lengthBody(req.body.meta_site_name, 0, 100), expected: false, error: 'Meta site name must not exceed 100 characters' },
		{ result: lengthBody(req.body.meta_url, 0, 100), expected: false, error: 'Meta url must not exceed 100 characters' },
		{ result: inArrayBody(req.body.captcha_options_type, ['grid', 'text', 'google', 'hcaptcha']), expected: true, error: 'Invalid captcha options type' },
		{ result: numberBody(req.body.captcha_options_generate_limit, 1), expected: false, error: 'Captcha options generate limit must be a number > 0' },
		{ result: numberBody(req.body.captcha_options_grid_size, 2, 6), expected: false, error: 'Captcha options grid size must be a number from 2-8' },
		{ result: numberBody(req.body.captcha_options_image_size, 50, 500), expected: false, error: 'Captcha options image size must be a number from 50-500' },
		{ result: numberBody(req.body.captcha_options_grid_icon_y_offset, 0, 50), expected: false, error: 'Captcha options icon y offset must be a number from 0-50' },
		{ result: numberBody(req.body.captcha_options_num_distorts_min, 0, 10), expected: false, error: 'Captcha options min distorts must be a number from 0-10' },
		{ result: numberBody(req.body.captcha_options_num_distorts_max, 0, 10), expected: false, error: 'Captcha options max distorts must be a number from 0-10' },
		{ result: minmaxBody(req.body.captcha_options_num_distorts_min, req.body.captcha_options_num_distorts_max), expected: false, error: 'Captcha options distorts min must be less than max' },
		{ result: numberBody(req.body.captcha_options_distortion, 0, 50), expected: false, error: 'Captcha options distortion must be a number from 0-50' },
	];

/*
		captchaOptions: {
			numDistorts: {
				min: numberSetting(req.body.captcha_options_num_distorts_min, oldSettings.captchaOptions.numDistorts.min),
				max: numberSetting(req.body.captcha_options_num_distorts_max, oldSettings.captchaOptions.numDistorts.max),
			},
			distortion: numberSetting(req.body.captcha_options_distortion, oldSettings.captchaOptions.distortion),
		},
		dnsbl: {
			blacklists: arraySetting(req.body.dnsbl_blacklists, oldSettings.dnsbl.blacklists),
			cacheTime: numberSetting(req.body.dnsbl_cache_time, oldSettings.dnsbl.cacheTime),
		},
		floodTimers: {
			sameContentSameIp: numberSetting(req.body.flood_timers_same_content_same_ip, oldSettings.floodTimers.sameContentSameIp),
			sameContentAnyIp: numberSetting(req.body.flood_timers_same_content_any_ip, oldSettings.floodTimers.sameContentAnyIp),
			anyContentSameIp: numberSetting(req.body.flood_timers_any_content_same_ip, oldSettings.floodTimers.anyContentSameIp),
		},
		blockBypass: {
			expireAfterUses: numberSetting(req.body.block_bypass_expire_after_uses, oldSettings.blockBypass.expireAfterUses),
			expireAfterTime: numberSetting(req.body.block_bypass_expire_after_time, oldSettings.blockBypass.expireAfterTime),
		},
		ipHashPermLevel: numberSetting(req.body.ip_hash_perm_level, oldSettings.ipHashPermLevel),
		deleteBoardPermLevel: numberSetting(req.body.delete_board_perm_level, oldSettings.deleteBoardPermLevel),
		rateLimitCost: {
			captcha: numberSetting(req.body.rate_limit_cost_captcha, oldSettings.rateLimitCost.captcha),
			boardSettings: numberSetting(req.body.rate_limit_cost_board_settings, oldSettings.rateLimitCost.boardSettings),
			editPost: numberSetting(req.body.rate_limit_cost_edit_post, oldSettings.rateLimitCost.editPost),
		},
		overboardLimit: numberSetting(req.body.overboard_limit, oldSettings.overboardLimit),
		overboardCatalogLimit: numberSetting(req.body.overboard_catalog_limit, oldSettings.overboardCatalogLimit),
		lockWait: numberSetting(req.body.lock_wait, oldSettings.lockWait),
		pruneModlogs: numberSetting(req.body.prune_modlogs, oldSettings.pruneModlogs),
		thumbExtension: trimSetting(req.body.thumb_extension, oldSettings.thumbExtension),
		thumbSize: numberSetting(req.body.thumb_size, oldSettings.thumbSize),
		videoThumbPercentage: numberSetting(req.body.video_thumb_percentage, oldSettings.videoThumbPercentage),
		otherMimeTypes: arraySetting(req.body.other_mime_types, oldSettings.otherMimeTypes),
		defaultBanDuration: numberSetting(req.body.default_ban_duration, oldSettings.defaultBanDuration),
		quoteLimit: numberSetting(req.body.quote_limit, oldSettings.quoteLimit),
		previewReplies: numberSetting(req.body.preview_replies, oldSettings.previewReplies),
		stickyPreviewReplies: numberSetting(req.body.sticky_preview_replies, oldSettings.stickyPreviewReplies),
		early404Fraction: numberSetting(req.body.early_404_fraction, oldSettings.early404Fraction),
		early404Replies: numberSetting(req.body.early_404_replies, oldSettings.early404Replies),
		maxRecentNews: numberSetting(req.body.max_recent_news, oldSettings.maxRecentNews),
		spaceFileNameReplacement: trimSetting(req.body.space_file_name_replacement, oldSettings.spaceFileNameReplacement),
		highlightOptions: {
			languageSubset: arraySetting(req.body.highlight_options_language_subset, oldSettings.highlightOptions.languageSubset),
			threshold: numberSetting(req.body.highlight_options_threshold, oldSettings.highlightOptions.threshold),

		},
		themes: arraySetting(req.body.themes, oldSettings.themes),
		codeThemes: arraySetting(req.body.code_themes, oldSettings.codeThemes),
		globalLimits:  {
			threadLimit: {
				min: numberSetting(req.body.global_limits_thread_limit_min, oldSettings.globalLimits.threadLimit.min),
				max: numberSetting(req.body.global_limits_thread_limit_max, oldSettings.globalLimits.threadLimit.max),
			},
			replyLimit: {
				min: numberSetting(req.body.global_limits_reply_limit_min, oldSettings.globalLimits.replyLimit.min),
				max: numberSetting(req.body.global_limits_reply_limit_max, oldSettings.globalLimits.replyLimit.max),
			},
			bumpLimit: {
				min: numberSetting(req.body.global_limits_bump_limit_min, oldSettings.globalLimits.bumpLimit.min),
				max: numberSetting(req.body.global_limits_bump_limit_max, oldSettings.globalLimits.bumpLimit.max),
			},
			postFiles: {
				max: numberSetting(req.body.global_limits_post_files_max, oldSettings.globalLimits.postFiles.max),
			},
			postFilesSize: {
				max: numberSetting(req.body.global_limits_post_files_size_max, oldSettings.globalLimits.postFilesSize.max),
			},
			bannerFiles: {
				width: numberSetting(req.body.global_limits_banner_files_width, oldSettings.globalLimits.bannerFiles.width),
				height: numberSetting(req.body.global_limits_banner_files_height, oldSettings.globalLimits.bannerFiles.height),
				max: numberSetting(req.body.global_limits_banner_files_max, oldSettings.globalLimits.bannerFiles.max),
				total: numberSetting(req.body.global_limits_banner_files_total, oldSettings.globalLimits.bannerFiles.total),
			},
			bannerFilesSize: {
				max: numberSetting(req.body.global_limits_banner_files_size_max, oldSettings.globalLimits.bannerFilesSize.max),
			},
			fieldLength: {
				name: numberSetting(req.body.global_limits_field_length_name, oldSettings.globalLimits.fieldLength.name),
				email: numberSetting(req.body.global_limits_field_length_email, oldSettings.globalLimits.fieldLength.email),
				subject: numberSetting(req.body.global_limits_field_length_subject, oldSettings.globalLimits.fieldLength.subject),
				postpassword: numberSetting(req.body.global_limits_field_length_postpassword, oldSettings.globalLimits.fieldLength.postpassword),
				message: numberSetting(req.body.global_limits_field_length_message, oldSettings.globalLimits.fieldLength.message),
				report_reason: numberSetting(req.body.global_limits_field_length_report_reason, oldSettings.globalLimits.fieldLength.report_reason),
				ban_reason: numberSetting(req.body.global_limits_field_length_ban_reason, oldSettings.globalLimits.fieldLength.ban_reason),
				log_message: numberSetting(req.body.global_limits_field_length_log_message, oldSettings.globalLimits.fieldLength.log_message),
				uri: numberSetting(req.body.global_limits_field_length_uri, oldSettings.globalLimits.fieldLength.uri),
				boardname: numberSetting(req.body.global_limits_field_length_boardname, oldSettings.globalLimits.fieldLength.boardname),
				description: numberSetting(req.body.global_limits_field_length_description, oldSettings.globalLimits.fieldLength.description),
			},
			multiInputs: {
				posts: {
					anon: numberSetting(req.body.global_limits_multi_input_posts_anon, oldSettings.globalLimits.multiInputs.posts.anon),
					staff: numberSetting(req.body.global_limits_multi_input_posts_staff, oldSettings.globalLimits.multiInputs.posts.staff),
				},
			},
			customCss: {
				max: numberSetting(req.body.global_limits_custom_css_max, oldSettings.globalLimits.customCss.max),
				filters: arraySetting(req.body.global_limits_custom_css_filters, oldSettings.globalLimits.customCss.filters),
			},
			customPages: {
				max: numberSetting(req.body.global_limits_custom_pages_max, oldSettings.globalLimits.customPages.max),
				maxLength: numberSetting(req.body.global_limits_custom_pages_max_length, oldSettings.globalLimits.customPages.maxLength),
			}
		},
		boardDefaults: {
			theme: trimSetting(req.body.board_defaults_theme, oldSettings.boardDefaults.theme),
			codeTheme: trimSetting(req.body.board_defaults_code_theme, oldSettings.boardDefaults.codeTheme),
			lockMode: numberSetting(req.body.board_defaults_lock_mode, oldSettings.boardDefaults.lockMode),
			fileR9KMode: numberSetting(req.body.board_defaults_file_r9k_mode, oldSettings.boardDefaults.fileR9KMode),
			messageR9KMode: numberSetting(req.body.board_defaults_message_r9k_mode, oldSettings.boardDefaults.messageR9KMode),
			captchaMode: numberSetting(req.body.board_defaults_captcha_mode, oldSettings.boardDefaults.captchaMode),
			tphTrigger: numberSetting(req.body.board_defaults_tph_trigger, oldSettings.boardDefaults.tphTrigger),
			pphTrigger: numberSetting(req.body.board_defaults_pph_trigger, oldSettings.boardDefaults.pphTrigger),
			tphTriggerAction: numberSetting(req.body.board_defaults_tph_trigger_action, oldSettings.boardDefaults.tphTriggerAction),
			pphTriggerAction: numberSetting(req.body.board_defaults_pph_trigger_action, oldSettings.boardDefaults.pphTriggerAction),
			captchaReset: numberSetting(req.body.board_defaults_captcha_reset, oldSettings.boardDefaults.captchaReset),
			lockReset: numberSetting(req.body.board_defaults_lock_reset, oldSettings.boardDefaults.lockReset),
			threadLimit: numberSetting(req.body.board_defaults_thread_limit, oldSettings.boardDefaults.threadLimit),
			replyLimit: numberSetting(req.body.board_defaults_reply_limit, oldSettings.boardDefaults.replyLimit),
			bumpLimit: numberSetting(req.body.board_defaults_bump_limit, oldSettings.boardDefaults.bumpLimit),
			maxFiles: numberSetting(req.body.board_defaults_max_files, oldSettings.boardDefaults.maxFiles),
			minThreadMessageLength: numberSetting(req.body.board_defaults_min_thread_message_length, oldSettings.boardDefaults.minThreadMessageLength),
			minReplyMessageLength: numberSetting(req.body.board_defaults_min_reply_message_length, oldSettings.boardDefaults.minReplyMessageLength),
			maxThreadMessageLength: numberSetting(req.body.board_defaults_max_thread_message_length, oldSettings.boardDefaults.maxThreadMessageLength),
			maxReplyMessageLength: numberSetting(req.body.board_defaults_max_reply_message_length, oldSettings.boardDefaults.maxReplyMessageLength),
			defaultName: trimSetting(req.body.board_defaults_default_name, oldSettings.boardDefaults.defaultName),
			customCSS: null,
			blockedCountries: [],
			filters: arraySetting(req.body.board_defaults_filters, oldSettings.boardDefaults.filters),
			filterMode: numberSetting(req.body.board_defaults_filter_mode, oldSettings.boardDefaults.filterMode),
			filterBanDuration: numberSetting(req.body.board_defaults_filter_ban_duration, oldSettings.boardDefaults.filterBanDuration),
			announcement: {
				raw: null,
				markdown: null
			},
		},
	};
*/

	const errors = checkSchema(schema);

	if (errors.length > 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/globalmanage/settings.html'
		});
	}

	try {
		await changeGlobalSettings(req, res, next);
	} catch (err) {
		return next(err);
	}

}
