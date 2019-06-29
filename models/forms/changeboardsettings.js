'use strict';

const Boards = require(__dirname+'/../../db/boards.js')
	, Posts = require(__dirname+'/../../db/posts.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, { buildHomepage, buildCatalog, buildBoardMultiple } = require(__dirname+'/../../helpers/build.js')
	, { remove } = require('fs-extra')

module.exports = async (req, res, next) => {

	const oldSettings = res.locals.board.settings;

	const newSettings = {
		name: req.body.name && req.body.name.trim().length > 0 ? req.body.name : oldSettings.name,
		description: req.body.description && req.body.description.trim().length > 0 ? req.body.description : oldSettings.description,
		ids: req.body.ids ? true : false,
		captcha: req.body.captcha ? true : false,
		forceAnon: req.body.force_anon ? true : false,
		userPostDelete: req.body.user_post_delete ? true : false,
		userPostSpoiler: req.body.user_post_spoiler ? true : false,
		userPostUnlink: req.body.user_post_unlink ? true : false,
		threadLimit: typeof req.body.thread_limit === 'number' && req.body.thread_limit !== oldSettings.threadLimit ? req.body.thread_limit : oldSettings.threadLimit,
		replyLimit: typeof req.body.reply_limit === 'number' && req.body.reply_limit !== oldSettings.replyLimit ? req.body.reply_limit : oldSettings.replyLimit,
		maxFiles: typeof req.body.max_files === 'number' && req.body.max_files !== oldSettings.maxFiles ? req.body.max_files : oldSettings.maxFiles,
		minMessageLength: typeof req.body.min_message_length === 'number' && req.body.min_message_length !== oldSettings.maxFiles ? req.body.min_message_length : oldSettings.minMessageLength,
		forceOPSubject: req.body.force_op_subject ? true : false,
		forceOPMessage: req.body.force_op_message ? true : false,
		forceOPFile: req.body.force_op_file ? true : false,
		defaultName: req.body.default_name && req.body.default_name.trim().length > 0 ? req.body.default_name : oldSettings.defaultName,
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
		const prunedThreads = await Posts.pruneOldThreads(req.params.board, res.locals.board.settings.threadLimit);
		if (prunedThreads.length > 0) {
			//remove pruned threads html also
			for (let i = 0; i < prunedThreads.length; i++) {
				promises.push(remove(`${uploadDirectory}html/${req.params.board}/thread/${prunedThreads[i]}.html`));
			}
			//remove board page html for pages > newMaxPage
			for (let i = newMaxPage+1; i <= oldMaxPage; i++) {
				promises.push(remove(`${uploadDirectory}html/${req.params.board}/${i}.html`));
			}
			//rebuild valid board pages for page numbers to be <= newMaxPage
			promises.push(buildBoardMultiple(res.locals.board, 1, newMaxPage));
			//rebuild catalog since some threads were pruned
			promises.push(buildCatalog(res.locals.board));
		}
	}

	if (oldSettings.captcha !== newSettings.captcha) {
		promises.push(remove(`${uploadDirectory}html/${req.params.board}/`));
	}

/* disabled since homepage is built daily on schedule
	if (oldSettings.name !== newSettings.name || oldSettings.description !== newSettings.description) {
		promises.push(buildHomepage())
	}
*/

	if (promises.length > 0) {
		await Promise.all(promises);
	}

	return res.render('message', {
		'title': 'Success',
		'message': 'Updated settings.',
		'redirect': `/${req.params.board}/manage.html`
	});

}
