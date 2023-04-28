'use strict';

const { Boards } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, uploadDirectory = require(__dirname+'/../../lib/file/uploaddirectory.js')
	, buildQueue = require(__dirname+'/../../lib/build/queue.js')
	, redis = require(__dirname+'/../../lib/redis/redis.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, Mongo = require(__dirname+'/../../db/db.js')
	, { prepareMarkdown } = require(__dirname+'/../../lib/post/markdown/markdown.js')
	, messageHandler = require(__dirname+'/../../lib/post/message.js')
	, { trimSetting, numberSetting, booleanSetting, arraySetting } = require(__dirname+'/../../lib/input/setting.js')
	, { includeChildren, compareSettings } = require(__dirname+'/../../lib/input/settingsdiff.js')
	, { remove } = require('fs-extra')
	, template = require(__dirname+'/../../configs/template.js.example')
	, settingChangeEntries = Object.entries({
		//doesnt seem like it would be much different transforming this to be tasks: [settings] or this way, so this way it is
		'globalAnnouncement.raw': ['deletehtml', 'custompages'],
		'meta.siteName': ['deletehtml', 'scripts', 'custompages'],
		'meta.url': ['deletehtml', 'scripts', 'custompages'],
		'archiveLinksURL': ['deletehtml', 'custompages'],
		'reverseImageLinksURL': ['deletehtml', 'custompages'],
		'enableWebring': ['deletehtml', 'custompages'],
		'thumbSize': ['deletehtml', 'css', 'scripts'],
		'previewReplies': ['deletehtml', 'custompages'],
		'stickyPreviewReplies': ['deletehtml', 'custompages'],
		'maxRecentNews': ['deletehtml', 'custompages'],
		'themes': ['scripts'],
		'codeThemes': ['scripts'],
		'globalLimits.postFiles.max': ['deletehtml', 'custompages'],
		'globalLimits.postFilesSize.max': ['deletehtml', 'custompages'],
		'language': ['deletehtml', 'css', 'scripts', 'custompages'],
		//these will make it easier to keep updated and include objects where any/all property change needs tasks
		//basically, it expands to all of globalLimits.fieldLength.* or frontendScriptDefault.*
		//it could be calculated in compareSettings with *, but im just precompiling it now. probably a tiny bit faster not doing it each time
		...includeChildren(template, 'captchaOptions', ['deletehtml', 'css', 'scripts', 'custompages']),
		...includeChildren(template, 'globalLimits.fieldLength', ['deletehtml', 'custompages']),
		...includeChildren(template, 'frontendScriptDefault', ['scripts']),
	});

module.exports = async (req, res) => {

	const { __ } = res.locals;
	const promises = [];
	const oldSettings = config.get;

	const announcement = req.body.global_announcement === null ? null : prepareMarkdown(req.body.global_announcement, false);
	let markdownAnnouncement = oldSettings.globalAnnouncement.markdown;
	if (announcement !== oldSettings.globalAnnouncement.raw) {
		({ message: markdownAnnouncement } = await messageHandler(announcement, null, null, res.locals.permissions));
	}

	const newSettings = {
		filters: arraySetting(req.body.filters, oldSettings.filters),
		filterMode: numberSetting(req.body.filter_mode, oldSettings.filterMode),
		strictFiltering: booleanSetting(req.body.strict_filtering, oldSettings.strictFiltering),
		filterBanDuration: numberSetting(req.body.ban_duration, oldSettings.filterBanDuration),
		filterBanAppealable: booleanSetting(req.body.filter_ban_appealable),
		allowedHosts: arraySetting(req.body.allowed_hosts, oldSettings.allowedHosts),
		countryCodeHeader: trimSetting(req.body.country_code_header, oldSettings.countryCodeHeader),
		ipHeader: trimSetting(req.body.ip_header, oldSettings.ipHeader),
		globalAnnouncement: {
			raw: trimSetting(announcement, oldSettings.globalAnnouncement.raw),
			markdown: trimSetting(markdownAnnouncement, oldSettings.globalAnnouncement.markdown),
		},
		meta: {
			siteName: trimSetting(req.body.meta_site_name, oldSettings.meta.siteName),
			url: trimSetting(req.body.meta_url, oldSettings.meta.url),
		},
		language: trimSetting(req.body.language, oldSettings.language),
		captchaOptions: {
			type: trimSetting(req.body.captcha_options_type, oldSettings.captchaOptions.type),
			generateLimit: numberSetting(req.body.captcha_options_generate_limit, oldSettings.captchaOptions.generateLimit),
			font: trimSetting(req.body.captcha_options_font, oldSettings.captchaOptions.font),
			grid: {
				size: numberSetting(req.body.captcha_options_grid_size, oldSettings.captchaOptions.grid.size),
				imageSize: numberSetting(req.body.captcha_options_grid_image_size, oldSettings.captchaOptions.grid.imageSize),
				iconYOffset: numberSetting(req.body.captcha_options_grid_icon_y_offset, oldSettings.captchaOptions.grid.iconYOffset),
				question: trimSetting(req.body.captcha_options_grid_question, oldSettings.captchaOptions.grid.question),
				trues: arraySetting(req.body.captcha_options_grid_trues, oldSettings.captchaOptions.grid.trues),
				falses: arraySetting(req.body.captcha_options_grid_falses, oldSettings.captchaOptions.grid.falses),
				edge: numberSetting(req.body.captcha_options_grid_edge, oldSettings.captchaOptions.grid.edge),
				noise: numberSetting(req.body.captcha_options_grid_noise, oldSettings.captchaOptions.grid.noise),
			},
			text: {
				line: booleanSetting(req.body.captcha_options_text_line, oldSettings.captchaOptions.text.line),
				wave: numberSetting(req.body.captcha_options_text_wave, oldSettings.captchaOptions.text.wave),
				paint: numberSetting(req.body.captcha_options_text_paint, oldSettings.captchaOptions.text.paint),
				noise: numberSetting(req.body.captcha_options_text_noise, oldSettings.captchaOptions.text.noise),
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
		pruneImmediately: booleanSetting(req.body.prune_immediately, oldSettings.pruneImmediately),
		hashImages: booleanSetting(req.body.hash_images, oldSettings.hashImages),
		rateLimitCost: {
			captcha: numberSetting(req.body.rate_limit_cost_captcha, oldSettings.rateLimitCost.captcha),
			boardSettings: numberSetting(req.body.rate_limit_cost_board_settings, oldSettings.rateLimitCost.boardSettings),
			editPost: numberSetting(req.body.rate_limit_cost_edit_post, oldSettings.rateLimitCost.editPost),
		},
		inactiveAccountTime: numberSetting(req.body.inactive_account_time, oldSettings.inactiveAccountTime),
		inactiveAccountAction: numberSetting(req.body.inactive_account_action, oldSettings.inactiveAccountAction),
		abandonedBoardAction: numberSetting(req.body.abandoned_board_action, oldSettings.abandonedBoardAction),
		overboardLimit: numberSetting(req.body.overboard_limit, oldSettings.overboardLimit),
		overboardCatalogLimit: numberSetting(req.body.overboard_catalog_limit, oldSettings.overboardCatalogLimit),
		overboardReverseLinks: booleanSetting(req.body.overboard_reverse_links, oldSettings.overboardReverseLinks),
		hotThreadsLimit: numberSetting(req.body.hot_threads_limit, oldSettings.hotThreadsLimit),
		hotThreadsThreshold: numberSetting(req.body.hot_threads_threshold, oldSettings.hotThreadsThreshold),
		hotThreadsMaxAge: numberSetting(req.body.hot_threads_max_age, oldSettings.hotThreadsMaxAge),
		allowCustomOverboard: booleanSetting(req.body.allow_custom_overboard, oldSettings.allowCustomOverboard),
		archiveLinksURL: trimSetting(req.body.archive_links, oldSettings.archiveLinksURL),
		reverseImageLinksURL: trimSetting(req.body.reverse_links, oldSettings.reverseImageLinksURL),
		cacheTemplates: booleanSetting(req.body.cache_templates, oldSettings.cacheTemplates),
		lockWait: numberSetting(req.body.lock_wait, oldSettings.lockWait),
		pruneModlogs: numberSetting(req.body.prune_modlogs, oldSettings.pruneModlogs),
		dontStoreRawIps: booleanSetting(req.body.dont_store_raw_ips, oldSettings.dontStoreRawIps),
		pruneIps: numberSetting(req.body.prune_ips, oldSettings.pruneIps),
		enableWebring: booleanSetting(req.body.enable_webring, oldSettings.enableWebring),
		following: arraySetting(req.body.webring_following, oldSettings.following),
		blacklist: arraySetting(req.body.webring_blacklist, oldSettings.blacklist),
		logo: arraySetting(req.body.webring_logos, oldSettings.logo),
		proxy: {
			enabled: booleanSetting(req.body.webring_proxy_enabled, oldSettings.proxy.enabled),
			address: trimSetting(req.body.webring_proxy_address, oldSettings.proxy.address),
		},
		thumbExtension: trimSetting(req.body.thumb_extension, oldSettings.thumbExtension),
		highlightOptions: {
			languageSubset: arraySetting(req.body.highlight_options_language_subset, oldSettings.highlightOptions.languageSubset),
			threshold: numberSetting(req.body.highlight_options_threshold, oldSettings.highlightOptions.threshold),
		},
		themes: arraySetting(req.body.themes, oldSettings.themes),
		codeThemes: arraySetting(req.body.code_themes, oldSettings.codeThemes),
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
			threadWatcher: booleanSetting(req.body.frontend_script_default_thread_watcher, oldSettings.frontendScriptDefault.threadWatcher),
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
			hideDeletedPostContent: booleanSetting(req.body.frontend_script_default_hide_deleted_post_content, oldSettings.frontendScriptDefault.hideDeletedPostContent),
			tegakiWidth: numberSetting(req.body.frontend_script_default_tegaki_width, oldSettings.frontendScriptDefault.tegakiWidth),
			tegakiHeight: numberSetting(req.body.frontend_script_default_tegaki_height, oldSettings.frontendScriptDefault.tegakiHeight),
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
		previewReplies: numberSetting(req.body.preview_replies, oldSettings.previewReplies),
		stickyPreviewReplies: numberSetting(req.body.sticky_preview_replies, oldSettings.stickyPreviewReplies),
		early404Fraction: numberSetting(req.body.early_404_fraction, oldSettings.early404Fraction),
		early404Replies: numberSetting(req.body.early_404_replies, oldSettings.early404Replies),
		maxRecentNews: numberSetting(req.body.max_recent_news, oldSettings.maxRecentNews),
		filterFileNames: booleanSetting(req.body.filter_file_names, oldSettings.filterFileNames),
		spaceFileNameReplacement: req.body.space_file_name_replacement,
		globalLimits:  {
			customCss: {
				enabled: booleanSetting(req.body.global_limits_custom_css_enabled, oldSettings.globalLimits.customCss.enabled),
				max: numberSetting(req.body.global_limits_custom_css_max, oldSettings.globalLimits.customCss.max),
				strict: booleanSetting(req.body.global_limits_custom_css_strict, oldSettings.globalLimits.customCss.strict),
				filters: arraySetting(req.body.global_limits_custom_css_filters, oldSettings.globalLimits.customCss.filters),
			},
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
				imageResolution: numberSetting(req.body.global_limits_post_files_size_image_resolution, oldSettings.globalLimits.postFilesSize.imageResolution),
				videoResolution: numberSetting(req.body.global_limits_post_files_size_video_resolution, oldSettings.globalLimits.postFilesSize.videoResolution),
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
			flagFiles: {
				max: numberSetting(req.body.global_limits_flag_files_max, oldSettings.globalLimits.flagFiles.max),
				total: numberSetting(req.body.global_limits_flag_files_total, oldSettings.globalLimits.flagFiles.total),
			},
			flagFilesSize: {
				max: numberSetting(req.body.global_limits_flag_files_size_max, oldSettings.globalLimits.flagFilesSize.max),
			},
			assetFiles: {
				max: numberSetting(req.body.global_limits_asset_files_max, oldSettings.globalLimits.assetFiles.max),
				total: numberSetting(req.body.global_limits_asset_files_total, oldSettings.globalLimits.assetFiles.total),
			},
			assetFilesSize: {
				max: numberSetting(req.body.global_limits_asset_files_size_max, oldSettings.globalLimits.assetFilesSize.max),
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
		boardDefaults: {
			language: trimSetting(req.body.board_defaults_language, oldSettings.boardDefaults.language),
			theme: trimSetting(req.body.board_defaults_theme, oldSettings.boardDefaults.theme),
			codeTheme: trimSetting(req.body.board_defaults_code_theme, oldSettings.boardDefaults.codeTheme),
			reverseImageSearchLinks: booleanSetting(req.body.board_defaults_reverse_image_search_links, oldSettings.boardDefaults.reverseImageSearchLinks),
			archiveLinks: booleanSetting(req.body.board_defaults_archive_links, oldSettings.boardDefaults.archiveLinks),
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
			defaultName: trimSetting(req.body.board_defaults_default_name, oldSettings.boardDefaults.defaultName),
			forceAnon: booleanSetting(req.body.board_defaults_force_anon, oldSettings.boardDefaults.forceAnon),
			sageOnlyEmail: booleanSetting(req.body.board_defaults_sage_only_email, oldSettings.boardDefaults.sageOnlyEmail),
			early404: booleanSetting(req.body.board_defaults_early_404, oldSettings.boardDefaults.early404),
			ids: booleanSetting(req.body.board_defaults_ids, oldSettings.boardDefaults.ids),
			customFlags: booleanSetting(req.body.board_defaults_custom_flags, oldSettings.boardDefaults.customFlags),
			geoFlags: booleanSetting(req.body.board_defaults_geo_flags, oldSettings.boardDefaults.geoFlags),
			enableTegaki: booleanSetting(req.body.board_defaults_enable_tegaki, oldSettings.boardDefaults.enableTegaki),
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
			hideBanners: booleanSetting(req.body.board_defaults_hide_banners, oldSettings.boardDefaults.hideBanners),
			minThreadMessageLength: numberSetting(req.body.board_defaults_min_thread_message_length, oldSettings.boardDefaults.minThreadMessageLength),
			minReplyMessageLength: numberSetting(req.body.board_defaults_min_reply_message_length, oldSettings.boardDefaults.minReplyMessageLength),
			maxThreadMessageLength: numberSetting(req.body.board_defaults_max_thread_message_length, oldSettings.boardDefaults.maxThreadMessageLength),
			maxReplyMessageLength: numberSetting(req.body.board_defaults_max_reply_message_length, oldSettings.boardDefaults.maxReplyMessageLength),
			disableAnonymizerFilePosting: booleanSetting(req.body.board_defaults_disable_anonymizer_file_posting, oldSettings.boardDefaults.disableAnonymizerFilePosting),
			filterMode: numberSetting(req.body.board_defaults_filter_mode, oldSettings.boardDefaults.filterMode),
			filterBanDuration: numberSetting(req.body.board_defaults_filter_ban_duration, oldSettings.boardDefaults.filterBanDuration),
			deleteProtectionAge: numberSetting(req.body.board_defaults_delete_protection_age, oldSettings.boardDefaults.deleteProtectionAge),
			deleteProtectionCount: numberSetting(req.body.board_defaults_delete_protection_count, oldSettings.boardDefaults.deleteProtectionCount),
			strictFiltering: booleanSetting(req.body.board_defaults_strict_filtering, oldSettings.boardDefaults.strictFiltering),
			customCSS: null,
			blockedCountries: [],
			filters: [],
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
	};

	await Mongo.setConfig(newSettings);

	//webring being disabled
	if (oldSettings.enableWebring === true && newSettings.enableWebring === false) {
		promises.push(Boards.db.deleteMany({ webring: true }));
		promises.push(remove(`${uploadDirectory}/json/webring.json`));
		redis.del('webringsites');
	}

	//finish the promises in parallel e.g. removing files
	if (promises.length > 0) {
		await Promise.all(promises);
	}

	//publish to redis so running processes get updated config
	redis.redisPublisher.publish('config', JSON.stringify(newSettings));

	//relevant tasks: deletehtml, css, scripts, custompages
	const gulpTasks = compareSettings(settingChangeEntries, oldSettings, newSettings, 4);

	if (gulpTasks.size > 0) {
		buildQueue.push({
			'task': 'gulp',
			'options': {
				'tasks': [...gulpTasks],
			}
		});
	}

	//updates /settings.json
	buildQueue.push({
		'task': 'buildGlobalSettings',
	});

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Updated settings.'),
		'redirect': '/globalmanage/settings.html'
	});

};
