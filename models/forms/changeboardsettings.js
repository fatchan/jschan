'use strict';

const { Boards, Posts, Accounts } = require(__dirname+'/../../db/')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, buildQueue = require(__dirname+'/../../queue.js')
	, cache = require(__dirname+'/../../redis.js')
	, { remove } = require('fs-extra')
	, deletePosts = require(__dirname+'/deletepost.js')
	, linkQuotes = require(__dirname+'/../../helpers/posting/quotes.js')
	, { markdown } = require(__dirname+'/../../helpers/posting/markdown.js')
	, sanitizeOptions = require(__dirname+'/../../helpers/posting/sanitizeoptions.js')
	, sanitize = require('sanitize-html');

module.exports = async (req, res, next) => {

	//oldsettings before changes
	const oldSettings = res.locals.board.settings;

	//array of promises we might need
	const promises = [];

	let markdownAnnouncement;
	if (req.body.announcement !== oldSettings.announcement.raw) {
		//remarkup the announcement if it changes
		const styled = markdown(req.body.announcement);
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
					//remove mod from accounts
					promises.push(Accounts.removeModBoard(modsRemoved, req.params.board));
				}
				if (modsAdded.length > 0) {
					//add mod to accounts
					promises.push(Accounts.addModBoard(modsAdded, req.params.board));
				}
			}
		}
	}

//todo: make separate functions for handling array, boolean, number, text settings.
	const newSettings = {
		moderators,
		'name': req.body.name && req.body.name.trim().length > 0 ? req.body.name : oldSettings.name,
		'description': req.body.description && req.body.description.trim().length > 0 ? req.body.description : oldSettings.description,
		'sfw': req.body.sfw ? true : false,
		'unlisted': req.body.unlisted ? true : false,
		'webring': req.body.webring ? true : false,
		'locked': req.body.locked ? true : false,
		'early404': req.body.early404 ? true : false,
		'ids': req.body.ids ? true : false,
		'flags': req.body.flags ? true : false,
		'forceAnon': req.body.force_anon ? true : false,
		'userPostDelete': req.body.user_post_delete ? true : false,
		'userPostSpoiler': req.body.user_post_spoiler ? true : false,
		'userPostUnlink': req.body.user_post_unlink ? true : false,
		'captchaMode': typeof req.body.captcha_mode === 'number' && req.body.captcha_mode !== oldSettings.captchaMode ? req.body.captcha_mode : oldSettings.captchaMode,
		'tphTrigger': typeof req.body.tph_trigger === 'number' && req.body.tph_trigger !== oldSettings.tphTrigger ? req.body.tph_trigger : oldSettings.tphTrigger,
		'pphTrigger': typeof req.body.pph_trigger === 'number' && req.body.pph_trigger !== oldSettings.pphTrigger ? req.body.pph_trigger : oldSettings.pphTrigger,
		'triggerAction': typeof req.body.trigger_action === 'number' && req.body.trigger_action !== oldSettings.triggerAction ? req.body.trigger_action : oldSettings.triggerAction,
		'threadLimit': typeof req.body.thread_limit === 'number' && req.body.thread_limit !== oldSettings.threadLimit ? req.body.thread_limit : oldSettings.threadLimit,
		'replyLimit': typeof req.body.reply_limit === 'number' && req.body.reply_limit !== oldSettings.replyLimit ? req.body.reply_limit : oldSettings.replyLimit,
		'maxFiles': typeof req.body.max_files === 'number' && req.body.max_files !== oldSettings.maxFiles ? req.body.max_files : oldSettings.maxFiles,
		'minThreadMessageLength': typeof req.body.min_thread_message_length === 'number' && req.body.min_thread_message_length !== oldSettings.minThreadMessageLength ? req.body.min_thread_message_length : oldSettings.minThreadMessageLength,
		'minReplyMessageLength': typeof req.body.min_reply_message_length === 'number' && req.body.min_reply_message_length !== oldSettings.minReplyMessageLength ? req.body.min_reply_message_length : oldSettings.minReplyMessageLength,
		'forceThreadMessage': req.body.force_thread_message ? true : false,
		'forceThreadFile': req.body.force_thread_file ? true : false,
		'forceReplyMessage': req.body.force_reply_message ? true : false,
		'forceReplyFile': req.body.force_reply_file ? true : false,
		'forceThreadSubject': req.body.force_thread_subject ? true : false,
		'defaultName': req.body.default_name && req.body.default_name.trim().length > 0 ? req.body.default_name : oldSettings.defaultName,
		'tags': req.body.tags !== null ? req.body.tags.split('\r\n').filter(n => n).slice(0,10) : oldSettings.tags,
		'filters': req.body.filters !== null ? req.body.filters.split('\r\n').filter(n => n).slice(0,50) : oldSettings.filters,
		'filterMode': typeof req.body.filter_mode === 'number' && req.body.filter_mode !== oldSettings.filterMode ? req.body.filter_mode : oldSettings.filterMode,
		'filterBanDuration': typeof req.body.ban_duration === 'number' && req.body.ban_duration !== oldSettings.filterBanDuration ? req.body.ban_duration : oldSettings.filterBanDuration,
		'theme': req.body.theme ? req.body.theme : oldSettings.theme,
		'codeTheme': req.body.code_theme ? req.body.code_theme : oldSettings.codeTheme,
		'announcement': {
			'raw': req.body.announcement !== null ? req.body.announcement : oldSettings.announcement.raw,
			'markdown': req.body.announcement !== null ? markdownAnnouncement : oldSettings.announcement.markdown
		},
		'allowedFileTypes': {
			'animatedImage': req.body.files_allow_animated_image ? true : false,
			'image': req.body.files_allow_image ? true : false,
			'video': req.body.files_allow_video ? true : false,
			'audio': req.body.files_allow_audio ? true : false,
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

	//name, description, sfw, unlisted, tags changed need webring update
	if ((oldSettings.webring && newSettings.webring)
		&& (oldSettings.name != newSettings.name
		|| oldSettings.description != newSettings.description
		|| oldSettings.unlisted != newSettings.unlisted
		|| oldSettings.sfw != newSettings.sfw
		|| oldSettings.tags != newSettings.tags)) {
		cache.set('webring_update', 1);
	}

	if (newSettings.captchaMode > oldSettings.captchaMode) {
		rebuildBoard = true;
		rebuildCatalog = true; //post form now on catalog page
		if (newSettings.captchaMode == 2) {
			rebuildThreads = true; //thread captcha enabled, removes threads
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
		|| newSettings.codeTheme !== oldSettings.codeTheme) {
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

	return res.render('message', {
		'title': 'Success',
		'message': 'Updated settings.',
		'redirect': `/${req.params.board}/manage/settings.html`
	});

}
