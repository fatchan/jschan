'use strict';

const { Boards, Posts } = require(__dirname+'/../../db/')
	, { debugLogs } = require(__dirname+'/../../configs/secrets.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, uploadDirectory = require(__dirname+'/../../lib/file/uploaddirectory.js')
	, buildQueue = require(__dirname+'/../../lib/build/queue.js')
	, { remove } = require('fs-extra')
	, deletePosts = require(__dirname+'/deletepost.js')
	, { prepareMarkdown } = require(__dirname+'/../../lib/post/markdown/markdown.js')
	, messageHandler = require(__dirname+'/../../lib/post/message.js')
	, { countryCodesSet } = require(__dirname+'/../../lib/misc/countries.js')
	, { trimSetting, numberSetting, booleanSetting, arraySetting } = require(__dirname+'/../../lib/input/setting.js')
	, { compareSettings } = require(__dirname+'/../../lib/input/settingsdiff.js')
	, settingChangeEntries = Object.entries({
		'userPostDelete': ['board', 'catalog', 'threads'],
		'userPostSpoiler': ['board', 'catalog', 'threads'],
		'userPostUnlink': ['board', 'catalog', 'threads'],
		'replyLimit': ['board', 'threads'],
		'archiveLinks': ['board', 'threads'],
		'reverseImageSearchLinks': ['board', 'threads'],
		'name': ['board', 'threads', 'catalog', 'other'],
		'description': ['board', 'threads', 'catalog', 'other'],
		'theme': ['board', 'threads', 'catalog', 'other'],
		'codetheme': ['board', 'threads', 'catalog', 'other'],
		'announcement.raw': ['board', 'threads', 'catalog', 'other'],
		'customCss': ['board', 'threads', 'catalog', 'other'],
		'language': ['board', 'threads', 'catalog', 'other'],
		'allowedFileTypes.other': ['board', 'threads', 'catalog'],
		'allowedFileTypes.image': ['board', 'threads', 'catalog'],
		'enableTegaki': ['board', 'threads', 'catalog'],
		'hideBanners': ['board', 'threads', 'catalog'],
		'enableWeb3': ['board', 'threads', 'catalog'],
	});

module.exports = async (req, res) => {

	const { __ } = res.locals;
	const { globalLimits } = config.get;

	//oldsettings before changes
	const oldSettings = res.locals.board.settings;

	//array of promises we might need
	const promises = [];

	const announcement = req.body.announcement === null ? null : prepareMarkdown(req.body.announcement, false);
	let markdownAnnouncement = oldSettings.announcement.markdown;
	if (announcement !== oldSettings.announcement.raw) {
		({ message: markdownAnnouncement } = await messageHandler(announcement, req.params.board, null, res.locals.permissions));
	}

	if (req.body.countries) {
		req.body.countries = [...new Set(req.body.countries)] //prevents submitting multiple of same code, not like it matters, but meh
			.filter(code => countryCodesSet.has(code))
			.slice(0, countryCodesSet.size);
	}

	const newSettings = {
		'name': trimSetting(req.body.name, oldSettings.name),
		'description': trimSetting(req.body.description, oldSettings.description),
		'defaultName': trimSetting(req.body.default_name, oldSettings.defaultName),
		'language': trimSetting(req.body.language, oldSettings.language),
		'theme': req.body.theme || oldSettings.theme,
		'codeTheme': req.body.code_theme || oldSettings.codeTheme,
		'sfw': booleanSetting(req.body.sfw),
		'archiveLinks': booleanSetting(req.body.archive_links),
		'reverseImageSearchLinks': booleanSetting(req.body.reverse_image_search_links),
		'unlistedLocal': booleanSetting(req.body.unlisted_local),
		'unlistedWebring': booleanSetting(req.body.unlisted_webring),
		'early404': booleanSetting(req.body.early404),
		'ids': booleanSetting(req.body.ids),
		'geoFlags': booleanSetting(req.body.geo_flags),
		'customFlags': booleanSetting(req.body.custom_flags),
		'enableTegaki': booleanSetting(req.body.enable_tegaki),
		'enableWeb3': booleanSetting(req.body.enable_web3),
		'forceAnon': booleanSetting(req.body.force_anon),
		'sageOnlyEmail': booleanSetting(req.body.sage_only_email),
		'userPostDelete': booleanSetting(req.body.user_post_delete),
		'userPostSpoiler': booleanSetting(req.body.user_post_spoiler),
		'userPostUnlink': booleanSetting(req.body.user_post_unlink),
		'forceThreadMessage': booleanSetting(req.body.force_thread_message),
		'forceThreadFile': booleanSetting(req.body.force_thread_file),
		'forceReplyMessage': booleanSetting(req.body.force_reply_message),
		'forceReplyFile': booleanSetting(req.body.force_reply_file),
		'forceThreadSubject': booleanSetting(req.body.force_thread_subject),
		'disableReplySubject': booleanSetting(req.body.disable_reply_subject),
		'hideBanners': booleanSetting(req.body.hide_banners),
		'captchaMode': numberSetting(req.body.captcha_mode, oldSettings.captchaMode),
		'tphTrigger': numberSetting(req.body.tph_trigger, oldSettings.tphTrigger),
		'tphTriggerAction': numberSetting(req.body.tph_trigger_action, oldSettings.tphTriggerAction),
		'pphTrigger': numberSetting(req.body.pph_trigger, oldSettings.pphTrigger),
		'pphTriggerAction': numberSetting(req.body.pph_trigger_action, oldSettings.pphTriggerAction),
		'captchaReset': numberSetting(req.body.captcha_reset, oldSettings.captchaReset),
		'lockReset': numberSetting(req.body.lock_reset, oldSettings.lockReset),
		'threadLimit': numberSetting(req.body.thread_limit, oldSettings.threadLimit),
		'replyLimit': numberSetting(req.body.reply_limit, oldSettings.replyLimit),
		'bumpLimit': numberSetting(req.body.bump_limit, oldSettings.bumpLimit),
		'maxFiles': numberSetting(req.body.max_files, oldSettings.maxFiles),
		'minThreadMessageLength': numberSetting(req.body.min_thread_message_length, oldSettings.minThreadMessageLength),
		'minReplyMessageLength': numberSetting(req.body.min_reply_message_length, oldSettings.minReplyMessageLength),
		'maxThreadMessageLength': numberSetting(req.body.max_thread_message_length, oldSettings.maxThreadMessageLength),
		'maxReplyMessageLength': numberSetting(req.body.max_reply_message_length, oldSettings.maxReplyMessageLength),
		'lockMode': numberSetting(req.body.lock_mode, oldSettings.lockMode),
		'messageR9KMode': numberSetting(req.body.message_r9k_mode, oldSettings.messageR9KMode),
		'fileR9KMode': numberSetting(req.body.file_r9k_mode, oldSettings.fileR9KMode),
		'deleteProtectionAge': numberSetting(req.body.delete_protection_age, oldSettings.deleteProtectionAge),
		'deleteProtectionCount': numberSetting(req.body.delete_protection_count, oldSettings.deleteProtectionCount),
		'blockedCountries': req.body.countries || [],
		'disableAnonymizerFilePosting': booleanSetting(req.body.disable_anonymizer_file_posting),
		'customCss': globalLimits.customCss.enabled ? (req.body.custom_css !== null ? req.body.custom_css : oldSettings.customCss) : null,
		'announcement': {
			'raw': announcement !== null ? announcement : oldSettings.announcement.raw,
			'markdown': req.body.announcement !== null ? markdownAnnouncement : oldSettings.announcement.markdown,
		},
		'allowedFileTypes': {
			'animatedImage': booleanSetting(req.body.files_allow_animated_image),
			'image': booleanSetting(req.body.files_allow_image),
			'video': booleanSetting(req.body.files_allow_video),
			'audio': booleanSetting(req.body.files_allow_audio),
			'other': booleanSetting(req.body.files_allow_other),
		},
	};

	//settings changed in the db
	await Boards.updateOne(req.params.board, {
		'$set':  {
			'settings': newSettings,
			'tags': arraySetting(req.body.tags, res.locals.board.tags, 10),
		}
	});

	//update this in locals incase is used in later parts
	res.locals.board.settings = newSettings;

	//pages in new vs old settings
	const oldMaxPage = Math.ceil(oldSettings.threadLimit/10);
	const newMaxPage = Math.ceil(newSettings.threadLimit/10);

	const rebuildTasks = compareSettings(settingChangeEntries, oldSettings, newSettings, 4);

	if (rebuildTasks.size < 4) {
		//after that is stuff not direct equality comparisons calcluated by compareSettings()
		if (newSettings.captchaMode > oldSettings.captchaMode) {
			if (oldSettings.captchaMode === 0) {
				rebuildTasks.add('board')
					.add('catalog');
			}
			if (newSettings.captchaMode === 2) {
				rebuildTasks.add('threads');
			}
		} else if (newSettings.captchaMode < oldSettings.captchaMode) {
			if (oldSettings.captchaMode === 2) {
				rebuildTasks.add('threads');
			}
			if (newSettings.captchaMode === 0) {
				rebuildTasks.add('board')
					.add('catalog');
			}
		}
		//do rebuilding and pruning if max number of pages is changed and any threads are pruned
		if (newMaxPage < oldMaxPage) {
			//prune old threads
			const prunedThreads = await Posts.pruneThreads(res.locals.board);
			if (prunedThreads.length > 0) {
				await deletePosts(prunedThreads, req.params.board, res.locals);
				//remove board page html/json for pages > newMaxPage
				for (let i = newMaxPage+1; i <= oldMaxPage; i++) {
					promises.push(remove(`${uploadDirectory}/html/${req.params.board}/${i}.html`));
					promises.push(remove(`${uploadDirectory}/json/${req.params.board}/${i}.json`));
				}
				//rebuild all board pages for page nav numbers, and catalog
				rebuildTasks.add('board')
					.add('catalog');
			}
		}
	}

	if (rebuildTasks.has('threads')) {
		promises.push(remove(`${uploadDirectory}/html/${req.params.board}/thread/`));
	}
	if (rebuildTasks.has('board')) {
		buildQueue.push({
			'task': 'buildBoardMultiple',
			'options': {
				'board': res.locals.board,
				'startpage': 1,
				'endpage': newMaxPage
			}
		});
	}
	if (rebuildTasks.has('catalog')) {
		buildQueue.push({
			'task': 'buildCatalog',
			'options': {
				'board': res.locals.board,
			}
		});
	}
	if (rebuildTasks.has('other')) {
		promises.push(remove(`${uploadDirectory}/html/${req.params.board}/logs/`));
		promises.push(remove(`${uploadDirectory}/html/${req.params.board}/custompage/`));
		buildQueue.push({
			'task': 'buildModLogList',
			'options': {
				'board': res.locals.board,
			}
		});
		buildQueue.push({
			'task': 'buildBanners',
			'options': {
				'board': res.locals.board,
			}
		});
	}

	//updates board/settings.json
	buildQueue.push({
		'task': 'buildBoardSettings',
		'options': {
			'board': res.locals.board,
		}
	});

	//finish the promises in parallel e.g. removing files
	if (promises.length > 0) {
		await Promise.all(promises);
	}

	debugLogs && console.log(req.params.board, 'board settings changed');

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Updated settings.'),
		'redirect': `/${req.params.board}/manage/settings.html`
	});

};
