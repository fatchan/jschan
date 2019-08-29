'use strict';

const { Boards, Posts, Accounts } = require(__dirname+'/../../db/')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, buildQueue = require(__dirname+'/../../queue.js')
	, { remove } = require('fs-extra')
	, deletePosts = require(__dirname+'/deletepost.js')
	, linkQuotes = require(__dirname+'/../../helpers/posting/quotes.js')
	, simpleMarkdown = require(__dirname+'/../../helpers/posting/markdown.js')
	, escape = require(__dirname+'/../../helpers/posting/escape.js')
	, sanitizeOptions = require(__dirname+'/../../helpers/posting/sanitizeoptions.js')
	, sanitize = require('sanitize-html');

module.exports = async (req, res, next) => {

	const oldSettings = res.locals.board.settings;

	let markdownAnnouncement;
	if (req.body.announcement !== oldSettings.announcement.raw) {
		//remarkup the announcement if it changes
		const escaped = escape(req.body.announcement);
		const styled = simpleMarkdown(escaped);
		const quoted = (await linkQuotes(req.params.board, styled, null)).quotedMessage;
		const sanitized = sanitize(quoted, sanitizeOptions.after);
		markdownAnnouncement = sanitized;
	}

	let moderators = req.body.moderators != null ? req.body.moderators.split('\n').filter(n => n).slice(0,10) : oldSettings.moderators
	if (moderators !== oldSettings.moderators) {
		//make sure moderators actually have existing accounts
		if (moderators.length > 0) {
			const validCount = await Accounts.count(moderators);
			if (validCount !== moderators.length) {
				moderators = oldSettings.moderators;
			}
		}
	}

	const newSettings = {
		moderators,
		'name': req.body.name && req.body.name.trim().length > 0 ? req.body.name : oldSettings.name,
		'description': req.body.description && req.body.description.trim().length > 0 ? req.body.description : oldSettings.description,
		'locked': req.body.locked ? true : false,
		'early404': req.body.early404 ? true : false,
		'ids': req.body.ids ? true : false,
		'forceAnon': req.body.force_anon ? true : false,
		'userPostDelete': req.body.user_post_delete ? true : false,
		'userPostSpoiler': req.body.user_post_spoiler ? true : false,
		'userPostUnlink': req.body.user_post_unlink ? true : false,
		'captchaMode': typeof req.body.captcha_mode === 'number' && req.body.captcha_mode !== oldSettings.captchaMode ? req.body.captcha_mode : oldSettings.captchaMode,
		'tphTrigger': typeof req.body.tph_trigger === 'number' && req.body.tph_trigger !== oldSettings.tphTrigger ? req.body.tph_trigger : oldSettings.tphTrigger,
		'tphTriggerAction': typeof req.body.tph_trigger_action === 'number' && req.body.tph_trigger_action !== oldSettings.tphTriggerAction ? req.body.tph_trigger_action : oldSettings.tphTriggerAction,
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
		'tags': req.body.tags !== null ? req.body.tags.split('\n').filter(n => n).slice(0,10) : oldSettings.tags,
		'filters': req.body.filters !== null ? req.body.filters.split('\n').filter(n => n).slice(0,50) : oldSettings.filters,
		'filterMode': typeof req.body.filter_mode === 'number' && req.body.filter_mode !== oldSettings.filterMode ? req.body.filter_mode : oldSettings.filterMode,
		'filterBanDuration': typeof req.body.ban_duration === 'number' && req.body.ban_duration !== oldSettings.filterBanDuration ? req.body.ban_duration : oldSettings.filterBanDuration,
		'announcement': {
			'raw': req.body.announcement !== null ? req.body.announcement : oldSettings.announcement.raw,
			'markdown': markdownAnnouncement || oldSettings.announcement.markdown
		},
		'allowedFileTypes': {
			'animatedImage': req.body.files_allow_animated_image ? true : false,
			'image': req.body.files_allow_image ? true : false,
			'video': req.body.files_allow_video ? true : false,
		},
	};

	//settings changed in the db
	await Boards.db.updateOne({ _id: req.params.board }, {
		'$set':  {
			'settings': newSettings
		}
	});

	//update this in locals incase is used in later parts
	res.locals.board.settings = newSettings;

	//array of promises we might need
	const promises = [];

	let captchaEnabled = false;
	if (newSettings.captchaMode > oldSettings.captchaMode) {
		captchaEnabled = true;
		if (newSettings.captchaMode == 2) {
			promises.push(remove(`${uploadDirectory}html/${req.params.board}/thread/`));
		}
		buildQueue.push({
	        'task': 'buildBoardMultiple',
			'options': {
				'board': res.locals.board,
				'startpage': 1,
				'endpage': newMaxPage
			}
		});
	}

	//do rebuilding and pruning if max number of pages is changed and any threads are pruned
	const oldMaxPage = Math.ceil(oldSettings.threadLimit/10);
	const newMaxPage = Math.ceil(newSettings.threadLimit/10);
	if (newMaxPage < oldMaxPage) {
		//prune old threads
		const prunedThreads = await Posts.pruneThreads(res.locals.board);
		if (prunedThreads.length > 0) {
			await deletePosts(prunedThreads, req.params.board);
			//remove board page html for pages > newMaxPage
			for (let i = newMaxPage+1; i <= oldMaxPage; i++) {
				promises.push(remove(`${uploadDirectory}html/${req.params.board}/${i}.html`));
			}
			//rebuild all board pages for page nav numbers, and catalog
			if (!captchaEnabled) {
				buildQueue.push({
			        'task': 'buildBoardMultiple',
					'options': {
						'board': res.locals.board,
						'startpage': 1,
						'endpage': newMaxPage
					}
				});
			}
			buildQueue.push({
		        'task': 'buildCatalog',
				'options': {
					'board': res.locals.board,
				}
			});
		}
	}

	if (promises.length > 0) {
		await Promise.all(promises);
	}

	return res.render('message', {
		'title': 'Success',
		'message': 'Updated settings.',
		'redirect': `/${req.params.board}/manage.html`
	});

}
