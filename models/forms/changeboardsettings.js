'use strict';

const Boards = require(__dirname+'/../../db/boards.js')
	, Posts = require(__dirname+'/../../db/posts.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, { buildHomepage, buildCatalog, buildBoardMultiple } = require(__dirname+'/../../helpers/build.js')
	, { remove } = require('fs-extra')
	, deletePosts = require(__dirname+'/deletepost.js')
	, linkQuotes = require(__dirname+'/../../helpers/posting/quotes.js')
	, simpleMarkdown = require(__dirname+'/../../helpers/posting/markdown.js')
	, sanitize = require('sanitize-html')
	, sanitizeOptions = {
		allowedTags: [ 'span', 'a', 'em', 'strong', 'small' ],
		allowedAttributes: {
			'a': [ 'href', 'class', 'referrerpolicy', 'target' ],
			'span': [ 'class' ]
		}
	};

module.exports = async (req, res, next) => {

	const oldSettings = res.locals.board.settings;

	let markdownAnnouncement;
	if (req.body.announcement !== oldSettings.announcement.raw) {
		const styled = simpleMarkdown(req.body.announcement);
		const quoted = (await linkQuotes(req.params.board, styled, null)).quotedMessage;
		const sanitized = sanitize(quoted, sanitizeOptions);
		markdownAnnouncement = sanitized;
	}

	const newSettings = {
		name: req.body.name && req.body.name.trim().length > 0 ? req.body.name : oldSettings.name,
		description: req.body.description && req.body.description.trim().length > 0 ? req.body.description : oldSettings.description,
		ids: req.body.ids ? true : false,
		forceAnon: req.body.force_anon ? true : false,
		userPostDelete: req.body.user_post_delete ? true : false,
		userPostSpoiler: req.body.user_post_spoiler ? true : false,
		userPostUnlink: req.body.user_post_unlink ? true : false,
		captchaMode: typeof req.body.captcha_mode === 'number' && req.body.captcha_mode !== oldSettings.captchaMode ? req.body.captcha_mode : oldSettings.captchaMode,
		captchaTriggerMode: typeof req.body.captcha_trigger === 'number' && req.body.captcha_trigger_mode !== oldSettings.captchaTriggerMode ? req.body.captcha_trigger_mode : oldSettings.captchaTriggerMode,
		captchaTrigger: typeof req.body.captcha_trigger === 'number' && req.body.captcha_trigger !== oldSettings.captchaTrigger ? req.body.captcha_trigger : oldSettings.captchaTrigger,
		threadLimit: typeof req.body.thread_limit === 'number' && req.body.thread_limit !== oldSettings.threadLimit ? req.body.thread_limit : oldSettings.threadLimit,
		replyLimit: typeof req.body.reply_limit === 'number' && req.body.reply_limit !== oldSettings.replyLimit ? req.body.reply_limit : oldSettings.replyLimit,
		maxFiles: typeof req.body.max_files === 'number' && req.body.max_files !== oldSettings.maxFiles ? req.body.max_files : oldSettings.maxFiles,
		minMessageLength: typeof req.body.min_message_length === 'number' && req.body.min_message_length !== oldSettings.maxFiles ? req.body.min_message_length : oldSettings.minMessageLength,
		forceOPSubject: req.body.force_op_subject ? true : false,
		forceOPMessage: req.body.force_op_message ? true : false,
		forceOPFile: req.body.force_op_file ? true : false,
		defaultName: req.body.default_name && req.body.default_name.trim().length > 0 ? req.body.default_name : oldSettings.defaultName,
		announcement: {
			raw: req.body.announcement !== null ? req.body.announcement : oldSettings.announcement.raw,
			markdown: markdownAnnouncement || oldSettings.announcement.markdown
		},
		filters: req.body.filters !== null ? req.body.filters.split('\n').filter(n => n) /*prevents empty*/ : oldSettings.filters
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
			//rebuild valid board pages for page numbers, and catalog for prunedthreads
			promises.push(buildBoardMultiple(res.locals.board, 1, newMaxPage));
			promises.push(buildCatalog(res.locals.board));
		}
	}

	if (newSettings.captchaMode !== oldSettings.captchaMode) {
		//TODO: only remove necessary pages here
		promises.push(remove(`${uploadDirectory}html/${req.params.board}/`));
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
