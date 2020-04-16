'use strict';

const { Boards, Posts, Accounts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { globalLimits } = require(__dirname+'/../../configs/main.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, buildQueue = require(__dirname+'/../../queue.js')
	, cache = require(__dirname+'/../../redis.js')
	, { remove } = require('fs-extra')
	, deletePosts = require(__dirname+'/deletepost.js')
	, linkQuotes = require(__dirname+'/../../helpers/posting/quotes.js')
	, { markdown } = require(__dirname+'/../../helpers/posting/markdown.js')
	, sanitizeOptions = require(__dirname+'/../../helpers/posting/sanitizeoptions.js')
	, sanitize = require('sanitize-html')
	, trimSetting = (setting, oldSetting) => {
		return setting && setting.trim().length > 0 ? setting : oldSetting;
	}
	, numberSetting = (setting, oldSetting) => {
		return typeof setting === 'number' && setting !== oldSetting ? setting : oldSetting;
	}
	, booleanSetting = (setting) => {
		return setting != null;
	}
	, arraySetting = (setting, oldSetting, limit) => {
		return setting !== null ? setting.split('\r\n').filter(n => n).slice(0,limit) : oldSettings;
	};

module.exports = async (req, res, next) => {

	//oldsettings before changes
	const oldSettings = res.locals.board.settings;

	//array of promises we might need
	const promises = [];

	let markdownAnnouncement = oldSettings.announcement.markdown;
	if (req.body.announcement !== oldSettings.announcement.raw) {
		//remarkup the announcement if it changes
		const styled = markdown(req.body.announcement || '');
		const quoted = (await linkQuotes(req.params.board, styled, null)).quotedMessage;
		const sanitized = sanitize(quoted, sanitizeOptions.after);
		markdownAnnouncement = sanitized;
	}

	let moderators = req.body.moderators != null ? req.body.moderators.split('\r\n').filter(n => n && !(n == res.locals.board.owner)).slice(0,10) : [];
	if (moderators.length === 0 && oldSettings.moderators.length > 0) {
		//remove all mods if mod list being emptied
		promises.push(Accounts.removeModBoard(oldSettings.moderators, req.params.board));
	} else if (moderators !== oldSettings.moderators) {
		if (moderators.length > 0) {
			//make sure moderators actually have existing accounts
			const validCount = await Accounts.countUsers(moderators);
			if (validCount !== moderators.length) {
				//some usernames were not valid, reset to old setting
				moderators = oldSettings.moderators;
			} else {
				//all accounts exist, check added/removed
				const modsRemoved = oldSettings.moderators.filter(m => !moderators.includes(m));
				const modsAdded = moderators.filter(m => !oldSettings.moderators.includes(m));
				if (modsRemoved.length > 0) {
					promises.push(Accounts.removeModBoard(modsRemoved, req.params.board));
				}
				if (modsAdded.length > 0) {
					promises.push(Accounts.addModBoard(modsAdded, req.params.board));
				}
			}
		}
	}

	const newSettings = {
		moderators,
		'name': trimSetting(req.body.name, oldSettings.name),
		'description': trimSetting(req.body.description, oldSettings.description),
		'defaultName': trimSetting(req.body.default_name, oldSettings.defaultName),
		'theme': req.body.theme || oldSettings.theme,
		'codeTheme': req.body.code_theme || oldSettings.codeTheme,
		'sfw': booleanSetting(req.body.sfw),
		'unlisted': booleanSetting(req.body.unlisted),
		'webring': booleanSetting(req.body.webring),
		'locked': booleanSetting(req.body.locked),
		'early404': booleanSetting(req.body.early404),
		'ids': booleanSetting(req.body.ids),
		'flags': booleanSetting(req.body.flags),
		'forceAnon': booleanSetting(req.body.force_anon),
		'userPostDelete': booleanSetting(req.body.user_post_delete),
		'userPostSpoiler': booleanSetting(req.body.user_post_spoiler),
		'userPostUnlink': booleanSetting(req.body.user_post_unlink),
		'forceThreadMessage': booleanSetting(req.body.force_thread_message),
		'forceThreadFile': booleanSetting(req.body.force_thread_file),
		'forceReplyMessage': booleanSetting(req.body.force_reply_message),
		'forceReplyFile': booleanSetting(req.body.force_reply_file),
		'forceThreadSubject': booleanSetting(req.body.force_thread_subject),
		'disableReplySubject': booleanSetting(req.body.disable_reply_subject),
		'captchaMode': numberSetting(req.body.captcha_mode, oldSettings.captchaMode),
		'tphTrigger': numberSetting(req.body.tph_trigger, oldSettings.tphTrigger),
		'pphTrigger': numberSetting(req.body.pph_trigger, oldSettings.pphTrigger),
		'triggerAction': numberSetting(req.body.trigger_action, oldSettings.triggerAction),
		'threadLimit': numberSetting(req.body.thread_limit, oldSettings.threadLimit),
		'replyLimit': numberSetting(req.body.reply_limit, oldSettings.replyLimit),
		'maxFiles': numberSetting(req.body.max_files, oldSettings.maxFiles),
		'minThreadMessageLength': numberSetting(req.body.min_thread_message_length, oldSettings.minThreadMessageLength),
		'minReplyMessageLength': numberSetting(req.body.min_reply_message_length, oldSettings.minReplyMessageLength),
		'maxThreadMessageLength': numberSetting(req.body.max_thread_message_length, oldSettings.maxThreadMessageLength),
		'maxReplyMessageLength': numberSetting(req.body.max_reply_message_length, oldSettings.maxReplyMessageLength),
		'filterMode': numberSetting(req.body.filter_mode, oldSettings.filterMode),
		'filterBanDuration': numberSetting(req.body.ban_duration, oldSettings.filterBanDuration),
		'tags': arraySetting(req.body.tags, oldSettings.tags, 10),
		'filters': arraySetting(req.body.filters, oldSettings.filters, 50),
		'strictFiltering': booleanSetting(req.body.strict_filtering),
		'customCss': globalLimits.customCss.enabled ? (req.body.custom_css !== null ? req.body.custom_css : oldSettings.customCss) : null,
		'announcement': {
			'raw': req.body.announcement !== null ? req.body.announcement : oldSettings.announcement.raw,
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
			'settings': newSettings
		}
	});

	//update this in locals incase is used in later parts
	res.locals.board.settings = newSettings;

	//pages in new vs old settings
	const oldMaxPage = Math.ceil(oldSettings.threadLimit/10);
	const newMaxPage = Math.ceil(newSettings.threadLimit/10);

	let rebuildThreads = false
		, rebuildBoard = false
		, rebuildCatalog = false
		, rebuildOther = false;

	if (newSettings.captchaMode > oldSettings.captchaMode) {
		if (oldSettings.captchaMode === 0) {
			rebuildBoard = true;
			rebuildCatalog = true;
		}
		if (newSettings.captchaMode === 2) {
			rebuildThreads = true;
		}
	} else if (newSettings.captchaMode < oldSettings.captchaMode) {
		if (oldSettings.captchaMode === 2) {
			rebuildThreads = true;
		}
		if (newSettings.captchaMode === 0) {
			rebuildBoard = true;
			rebuildCatalog = true;
		}
	}

	//do rebuilding and pruning if max number of pages is changed and any threads are pruned
	if (newMaxPage < oldMaxPage) {
		//prune old threads
		const prunedThreads = await Posts.pruneThreads(res.locals.board);
		if (prunedThreads.length > 0) {
			await deletePosts(prunedThreads, req.params.board);
			//remove board page html/json for pages > newMaxPage
			for (let i = newMaxPage+1; i <= oldMaxPage; i++) {
				promises.push(remove(`${uploadDirectory}/html/${req.params.board}/${i}.html`));
				promises.push(remove(`${uploadDirectory}/json/${req.params.board}/${i}.json`));
			}
			//rebuild all board pages for page nav numbers, and catalog
			rebuildBoard = true;
			rebuildCatalog = true;
		}
	}

	if (newSettings.theme !== oldSettings.theme
		|| newSettings.codeTheme !== oldSettings.codeTheme
		|| newSettings.announcement.raw !== oldSettings.announcement.raw
		|| newSettings.customCss !== oldSettings.customCss) {
		rebuildThreads = true;
		rebuildBoard = true;
		rebuildCatalog = true;
		rebuildOther = true;
	}

	if (rebuildThreads) {
		promises.push(remove(`${uploadDirectory}/html/${req.params.board}/thread/`));
	}
	if (rebuildBoard) {
		buildQueue.push({
			'task': 'buildBoardMultiple',
			'options': {
				'board': res.locals.board,
				'startpage': 1,
				'endpage': newMaxPage
			}
		});
	}
	if (rebuildCatalog) {
		buildQueue.push({
			'task': 'buildCatalog',
			'options': {
				'board': res.locals.board,
			}
		});
	}
	if (rebuildOther) {
		//NOTE does not rebuild individual log pages they are stuck on old theme for now
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

	//finish the promises in parallel e.g. removing files
	if (promises.length > 0) {
		await Promise.all(promises);
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Updated settings.',
		'redirect': `/${req.params.board}/manage/settings.html`
	});

}
