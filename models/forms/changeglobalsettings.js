'use strict';

const { Boards, Posts, Accounts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, buildQueue = require(__dirname+'/../../queue.js')
	, redis = require(__dirname+'/../../redis.js')
	, config = require(__dirname+'/../../config.js')
	, { trimSetting, numberSetting, booleanSetting, arraySetting } = require(__dirname+'/../../helpers/setting.js')
	, { remove } = require('fs-extra');

module.exports = async (req, res, next) => {

	const promises = [];
	const oldSettings = config.get;

	const newSettings = {
		...oldSettings,
		filters: arraySetting(req.body.filters, oldSettings.filters),
		filterMode: numberSetting(req.body.filter_mode, oldSettings.filterMode),
		filterBanDuration: numberSetting(req.body.ban_duration, oldSettings.filterBanDuration),
		allowedHosts: arraySetting(req.body.allowed_hosts, oldSettings.allowedHosts),
		countryCodeHeader: trimSetting(req.body.country_code_header, oldSettings.countryCodeHeader),
		ipHeader: trimSetting(req.body.ip_header, oldSettings.ipHeader),
		meta: {
			siteName: trimSetting(req.body.meta_site_name, oldSettings.meta.siteName),
			url: trimSetting(req.body.meta_url, oldSettings.meta.url),
		},
		captchaOptions: {
			type: trimSetting(req.body.captcha_options_type, oldSettings.captchaOptions.type),
			generateLimit: trimSetting(req.body.captcha_options_generate_limit, oldSettings.captchaOptions.generateLimit),
			grid: {
				size: trimSetting(req.body.captcha_options_grid_size, oldSettings.captchaOptions.grid.size),
				imageSize: trimSetting(req.body.captcha_options_grid_image_size, oldSettings.captchaOptions.grid.imageSize),
				iconYOffset: trimSetting(req.body.captcha_options_grid_icon_y_offset, oldSettings.captchaOptions.grid.iconYOffset),
			},
			numDistorts: {
				min: numberSetting(req.body.captcha_options_num_distorts_min, oldSettings.captchaOptions.numDistorts.min),
				max: numberSetting(req.body.captcha_options_num_distorts_max, oldSettings.captchaOptions.numDistorts.max),
			},
			distortion: numberSetting(req.body.captcha_options_distortion, oldSettings.captchaOptions.distortion),
		},
		secureCookies: booleanSetting(req.body.secure_cookies),
		refererCheck: booleanSetting(req.body.referrer_check),
		dnsbl: {
			enabled: booleanSetting(req.body.dnsbl_enabled),
			blacklists: arraySetting(req.body.dnsbl_blacklists, oldSettings.dnsbl.blacklists),
			cacheTime: numberSetting(req.body.dnsbl_cache_time, oldSettings.dnsbl.cacheTime),
		},
		disableAnonymizerFilePosting: booleanSetting(req.body.disable_anonymizer_file_posting, oldSettings.disableAnonymizerFilePosting),
		statsCountAnonymizers: booleanSetting(req.body.stats_count_anonymizers, oldSettings.statsCountAnonymizers),

		floodTimers: {
			sameContentSameIp: numberSetting(req.body.flood_timers_same_content_same_ip, oldSettings.floodTimers.sameContentSameIp),
			sameContentAnyIp: numberSetting(req.body.flood_timers_same_content_any_ip, oldSettings.floodTimers.sameContentAnyIp),
			anyContentSameIp: numberSetting(req.body.flood_timers_any_content_same_ip, oldSettings.floodTimers.anyContentSameIp),
		},
		blockBypass: {
			enabled: booleanSetting(req.body.block_bypass_enabled, oldSettings.blockBypass.enabled),
			forceAnonymizers: booleanSetting(req.body.block_bypass_force_anonymizers, oldSettings.blockBypass.forceAnonymizers),
			expireAfterUses: numberSetting(req.body.block_bypass_expire_after_uses, oldSettings.blockBypass.expireAfterUses),
			expireAfterTime: numberSetting(req.body.block_bypass_expire_after_time, oldSettings.blockBypass.expireAfterTime),
			bypassDnsbl: booleanSetting(req.body.block_bypass_bypass_dnsbl, oldSettings.blockBypass.bypassDnsbl),
		},
		ipHashPermLevel: numberSetting(req.body.ip_hash_perm_level, oldSettings.ipHashPermLevel),
		deleteBoardPermLevel: numberSetting(req.body.delete_board_perm_level, oldSettings.deleteBoardPermLevel),
		pruneImmediately: booleanSetting(req.body.prune_immediately, oldSettings.pruneImmediately),
		hashImages: booleanSetting(req.body.hash_images, oldSettings.hashImages),
		rateLimitCost: {
			captcha: numberSetting(req.body.rate_limit_cost_captcha, oldSettings.rateLimitCost.captcha),
			boardSettings: numberSetting(req.body.rate_limit_cost_board_settings, oldSettings.rateLimitCost.boardSettings),
			editPost: numberSetting(req.body.rate_limit_cost_edit_post, oldSettings.rateLimitCost.editPost),
		},
		overboardLimit: numberSetting(req.body.overboard_limit, oldSettings.overboardLimit),
		overboardCatalogLimit: numberSetting(req.body.overboard_catalog_limit, oldSettings.overboardCatalogLimit),
		cacheTemplates: booleanSetting(req.body.cache_templates, oldSettings.cacheTemplates),
		lockWait: numberSetting(req.body.lock_wait, oldSettings.lockWait),
		pruneModlogs: numberSetting(req.body.prune_modlogs, oldSettings.pruneModlogs),
		pruneIps: numberSetting(req.body.prune_ips, oldSettings.pruneIps),
		enableWebring: booleanSetting(req.body.enable_webring, oldSettings.enableWebring),
		enableUserBoardCreation: booleanSetting(req.body.enable_user_board_creation, oldSettings.enableUserBoardCreation),
		enableUserAccountCreation: booleanSetting(req.body.enable_user_account_creation, oldSettings.enableUserAccountCreation),
		thumbExtension: trimSetting(req.body.thumb_extension, oldSettings.thumbExtension),
		highlightOptions: {
			languageSubset: arraySetting(req.body.highlight_options_language_subset, oldSettings.highlightOptions.languageSubset),
			threshold: numberSetting(req.body.highlight_options_threshold, oldSettings.highlightOptions.threshold),
		},
		themes: arraySetting(req.body.themes, oldSettings.themes),
		codeThemes: arraySetting(req.body.code_themes, oldSettings.codeThemes),
		globalLimits:  {
			...oldSettings.globalLimits,
			customCss: {
				enabled: booleanSetting(req.body.global_limits_custom_css_enabled, oldSettings.globalLimits.customCss.enabled),
				max: numberSetting(req.body.global_limits_custom_css_max, oldSettings.globalLimits.customCss.max),
				strict: booleanSetting(req.body.global_limits_custom_css_strict, oldSettings.globalLimits.customCss.strict),
				filters: arraySetting(req.body.global_limits_custom_css_filters, oldSettings.globalLimits.customCss.filters),
			},
		},
		boardDefaults: {
			...oldSettings.boardDefaults,
			theme: trimSetting(req.body.board_defaults_theme, oldSettings.boardDefaults.theme),
			codeTheme: trimSetting(req.body.board_defaults_code_theme, oldSettings.boardDefaults.codeTheme),
		}

/*
		globalLimits: {
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
				forceAspectRatio: booleanSetting(req.body.global_limits_banner_files_force_aspect_ratio, oldSettings.globalLimits.bannerFiles.forceAspectRatio),
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
			customPages: {
				max: numberSetting(req.body.global_limits_custom_pages_max, oldSettings.globalLimits.customPages.max),
				maxLength: numberSetting(req.body.global_limits_custom_pages_max_length, oldSettings.globalLimits.customPages.maxLength),
			}
		},
		animatedGifThumbnails: booleanSetting(req.body.animated_gif_thumbnails, oldSettings.animatedGifThumbnails),
		audioThumbnails: booleanSetting(req.body.audio_thumbnails, oldSettings.audioThumbnails),
		ffmpegGifThumbnails: booleanSetting(req.body.ffmpeg_gif_thumbnails, oldSettings.ffmpegGifThumbnails),
		thumbSize: numberSetting(req.body.thumb_size, oldSettings.thumbSize),
		videoThumbPercentage: numberSetting(req.body.video_thumb_percentage, oldSettings.videoThumbPercentage),
		otherMimeTypes: arraySetting(req.body.other_mime_types, oldSettings.otherMimeTypes),
		checkRealMimeTypes: booleanSetting(req.body.check_real_mime_types, oldSettings.checkRealMimeTypes),
		allowMimeNoMatch: booleanSetting(req.body.allow_mime_no_match, oldSettings.allowMimeNoMatch),
		defaultBanDuration: numberSetting(req.body.default_ban_duration, oldSettings.defaultBanDuration),
		quoteLimit: numberSetting(req.body.quote_limit, oldSettings.quoteLimit),
		strictFiltering: booleanSetting(req.body.strict_filtering, oldSettings.strictFiltering),
		previewReplies: numberSetting(req.body.preview_replies, oldSettings.previewReplies),
		stickyPreviewReplies: numberSetting(req.body.sticky_preview_replies, oldSettings.stickyPreviewReplies),
		early404Fraction: numberSetting(req.body.early_404_fraction, oldSettings.early404Fraction),
		early404Replies: numberSetting(req.body.early_404_replies, oldSettings.early404Replies),
		maxRecentNews: numberSetting(req.body.max_recent_news, oldSettings.maxRecentNews),
		filterFileNames: booleanSetting(req.body.filter_file_names, oldSettings.filterFileNames),
		spaceFileNameReplacement: trimSetting(req.body.space_file_name_replacement, oldSettings.spaceFileNameReplacement),
		frontendScriptDefault: {
			embedsEnabled: booleanSetting(req.body.frontend_script_default_embeds_enabled, oldSettings.frontendScriptDefault.embedsEnabled),
			heightUnlimit: booleanSetting(req.body.frontend_script_default_height_unlimit, oldSettings.frontendScriptDefault.heightUnlimit),
			hideRecursive: booleanSetting(req.body.frontend_script_default_hide_recursive, oldSettings.frontendScriptDefault.hideRecursive),
			crispImages: booleanSetting(req.body.frontend_script_default_crisp_images, oldSettings.frontendScriptDefault.crispImages),
			hideThumbnails: booleanSetting(req.body.frontend_script_default_hide_thumbnails, oldSettings.frontendScriptDefault.hideThumbnails),
			nonColorIds: booleanSetting(req.body.frontend_script_default_non_color_ids, oldSettings.frontendScriptDefault.nonColorIds),
			alwaysShowSpoilers: booleanSetting(req.body.frontend_script_default_always_show_spoilers, oldSettings.frontendScriptDefault.alwaysShowSpoilers),
			hidePostStubs: booleanSetting(req.body.frontend_script_default_hide_post_stubs, oldSettings.frontendScriptDefault.hidePostStubs),
			smoothScrolling: booleanSetting(req.body.frontend_script_default_smooth_scrolling, oldSettings.frontendScriptDefault.smoothScrolling),
			defaultVolume: numberSetting(req.body.frontend_script_default_volume, oldSettings.frontendScriptDefault.defaultVolume),
			loop: booleanSetting(req.body.frontend_script_default_loop, oldSettings.frontendScriptDefault.loop),
			imageLoadingBars: booleanSetting(req.body.frontend_script_default_image_loading_bars, oldSettings.frontendScriptDefault.imageLoadingBars),
			live: booleanSetting(req.body.frontend_script_default_live, oldSettings.frontendScriptDefault.live),
			scrollToPosts: booleanSetting(req.body.frontend_script_default_scroll_to_posts, oldSettings.frontendScriptDefault.scrollToPosts),
			localTime: booleanSetting(req.body.frontend_script_default_local_time, oldSettings.frontendScriptDefault.localTime),
			hour24Time: booleanSetting(req.body.frontend_script_default_hour_24_time, oldSettings.frontendScriptDefault.hour24Time),
			relativeTime: booleanSetting(req.body.frontend_script_default_relative_time, oldSettings.frontendScriptDefault.relativeTime),
			notificationsEnabled: booleanSetting(req.body.frontend_script_default_notifications_embed, oldSettings.frontendScriptDefault.notificationsEnabled),
			notificationsYousOnly: booleanSetting(req.body.frontend_script_default_notifications_yous_only, oldSettings.frontendScriptDefault.notificationsYousOnly),
			showYous: booleanSetting(req.body.frontend_script_default_show_yous, oldSettings.frontendScriptDefault.showYous),
		},
		boardDefaults: {
			sfw: booleanSetting(req.body.board_defaults_sfw, oldSettings.boardDefaults.sfw),
			lockMode: numberSetting(req.body.board_defaults_lock_mode, oldSettings.boardDefaults.lockMode),
			fileR9KMode: numberSetting(req.body.board_defaults_file_r9k_mode, oldSettings.boardDefaults.fileR9KMode),
			messageR9KMode: numberSetting(req.body.board_defaults_message_r9k_mode, oldSettings.boardDefaults.messageR9KMode),
			unlistedLocal: booleanSetting(req.body.board_defaults_unlisted_local, oldSettings.boardDefaults.unlistedLocal),
			unlistedWebring: booleanSetting(req.body.board_defaults_unlisted_webring, oldSettings.boardDefaults.unlistedWebring),
			captchaMode: numberSetting(req.body.board_defaults_captcha_mode, oldSettings.boardDefaults.captchaMode),
			tphTrigger: numberSetting(req.body.board_defaults_tph_trigger, oldSettings.boardDefaults.tphTrigger),
			pphTrigger: numberSetting(req.body.board_defaults_pph_trigger, oldSettings.boardDefaults.pphTrigger),
			tphTriggerAction: numberSetting(req.body.board_defaults_tph_trigger_action, oldSettings.boardDefaults.tphTriggerAction),
			pphTriggerAction: numberSetting(req.body.board_defaults_pph_trigger_action, oldSettings.boardDefaults.pphTriggerAction),
			captchaReset: numberSetting(req.body.board_defaults_captcha_reset, oldSettings.boardDefaults.captchaReset),
			lockReset: numberSetting(req.body.board_defaults_lock_reset, oldSettings.boardDefaults.lockReset),
			forceAnon: booleanSetting(req.body.board_defaults_force_anon, oldSettings.boardDefaults.forceAnon),
			sageOnlyEmail: booleanSetting(req.body.board_defaults_sage_only_email, oldSettings.boardDefaults.sageOnlyEmail),
			early404: booleanSetting(req.body.board_defaults_early_404, oldSettings.boardDefaults.early404),
			ids: booleanSetting(req.body.board_defaults_ids, oldSettings.boardDefaults.ids),
			flags: booleanSetting(req.body.board_defaults_flags, oldSettings.boardDefaults.flags),
			userPostDelete: booleanSetting(req.body.board_defaults_user_post_delete, oldSettings.boardDefaults.userPostDelete),
			userPostSpoiler: booleanSetting(req.body.board_defaults_user_post_spoiler, oldSettings.boardDefaults.userPostSpoiler),
			userPostUnlink: booleanSetting(req.body.board_defaults_user_post_unlink, oldSettings.boardDefaults.userPostUnlink),
			threadLimit: numberSetting(req.body.board_defaults_thread_limit, oldSettings.boardDefaults.threadLimit),
			replyLimit: numberSetting(req.body.board_defaults_reply_limit, oldSettings.boardDefaults.replyLimit),
			bumpLimit: numberSetting(req.body.board_defaults_bump_limit, oldSettings.boardDefaults.bumpLimit),
			maxFiles: numberSetting(req.body.board_defaults_max_files, oldSettings.boardDefaults.maxFiles),
			forceReplyMessage: booleanSetting(req.body.board_defaults_force_reply_message, oldSettings.boardDefaults.forceReplyMessage),
			forceReplyFile: booleanSetting(req.body.board_defaults_force_reply_file, oldSettings.boardDefaults.forceReplyFile),
			forceThreadMessage: booleanSetting(req.body.board_defaults_force_thread_message, oldSettings.boardDefaults.forceThreadMessage),
			forceThreadFile: booleanSetting(req.body.board_defaults_force_thread_file, oldSettings.boardDefaults.forceThreadFile),
			forceThreadSubject: booleanSetting(req.body.board_defaults_force_thread_subject, oldSettings.boardDefaults.forceThreadSubject),
			disableReplySubject: booleanSetting(req.body.board_defaults_disable_reply_subject, oldSettings.boardDefaults.disableReplySubject),
			minThreadMessageLength: numberSetting(req.body.board_defaults_min_thread_message_length, oldSettings.boardDefaults.minThreadMessageLength),
			minReplyMessageLength: numberSetting(req.body.board_defaults_min_reply_message_length, oldSettings.boardDefaults.minReplyMessageLength),
			maxThreadMessageLength: numberSetting(req.body.board_defaults_max_thread_message_length, oldSettings.boardDefaults.maxThreadMessageLength),
			maxReplyMessageLength: numberSetting(req.body.board_defaults_max_reply_message_length, oldSettings.boardDefaults.maxReplyMessageLength),
			defaultName: trimSetting(req.body.board_defaults_default_name, oldSettings.boardDefaults.defaultName),
			customCSS: null,
			blockedCountries: [],
			disableAnonymizerFilePosting: booleanSetting(req.body.board_defaults_disable_anonymizer_file_posting, oldSettings.boardDefaults.disableAnonymizerFilePosting),
			filters: [],
			filterMode: numberSetting(req.body.board_defaults_filter_mode, oldSettings.boardDefaults.filterMode),
			filterBanDuration: numberSetting(req.body.board_defaults_filter_ban_duration, oldSettings.boardDefaults.filterBanDuration),
			strictFiltering: booleanSetting(req.body.board_defaults_strict_filtering, oldSettings.boardDefaults.strictFiltering),
			announcement: {
				raw: null,
				markdown: null
			},
			allowedFileTypes: {
				animatedImage: booleanSetting(req.body.board_defaults_allowed_file_types_animated_image, oldSettings.boardDefaults.allowedFileTypes.animatedImage),
				image: booleanSetting(req.body.board_defaults_allowed_file_types_image, oldSettings.boardDefaults.allowedFileTypes.image),
				video: booleanSetting(req.body.board_defaults_allowed_file_types_video, oldSettings.boardDefaults.allowedFileTypes.video),
				audio: booleanSetting(req.body.board_defaults_allowed_file_types_audio, oldSettings.boardDefaults.allowedFileTypes.audio),
				other: booleanSetting(req.body.board_defaults_allowed_file_types_other, oldSettings.boardDefaults.allowedFileTypes.other)
			}
		},

*/
	};

	redis.set('globalsettings', newSettings);

/*
//todo: implement removing pages/rebuilding for all affected boards i.e. query for ones with settings.catchaMode < newSettings.captchaMode
	let rebuildThreads = false
		, rebuildBoard = false
		, rebuildCatalog = false;
	if (newSettings.captchaMode > oldSettings.captchaMode) {
		rebuildBoard = true;
		rebuildCatalog = true;
		if (newSettings.captchaMode == 2) {
			rebuildThreads = true; //thread captcha enabled, removes threads
		}
		const affectedBoards = //query here
		for (let i = 0; i < affectedBoards.length; i++) {
			const board = affectedBoards[i];
			if (rebuildThreads) {
				promises.push(remove(`${uploadDirectory}/html/${board._id}/thread/`));
			}
			if (rebuildBoard) {
				buildQueue.push({
					'task': 'buildBoardMultiple',
					'options': {
						board,
						'startpage': 1,
						'endpage': null //no endpage will use whatver maxpage of board is
					}
				});
			}
			if (rebuildCatalog) {
				buildQueue.push({
					'task': 'buildCatalog',
					'options': {
						board,
					}
				});
			}
		}
	}
*/

	//finish the promises in parallel e.g. removing files
	if (promises.length > 0) {
		await Promise.all(promises);
	}

	//publish to redis so running processes get updated config
	redis.redisPublisher.publish('config', JSON.stringify(newSettings));

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Updated settings.',
		'redirect': '/globalmanage/settings.html'
	});

}
