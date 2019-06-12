'use strict';

const Boards = require(__dirname+'/../../db/boards.js')

module.exports = async (req, res, next) => {

	const oldSettings = res.locals.board.settings;

	const newSettings = {
		captcha: req.body.captcha ? true : false,
		forceAnon: req.body.force_anon ? true : false,
		ids: req.body.ids ? true : false,
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

	//should i rebuild any pages here since the post form might change? probably not. at most board pages.

    return res.render('message', {
        'title': 'Success',
        'message': 'Updated settings.',
        'redirect': `/${req.params.board}/manage.html`
    });

}
