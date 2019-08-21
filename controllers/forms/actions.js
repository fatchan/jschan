'use strict';

const { Posts } = require(__dirname+'/../../db/')
	, actionHandler = require(__dirname+'/../../models/forms/actionhandler.js')
	, actionChecker = require(__dirname+'/../../helpers/checks/actionchecker.js');

module.exports = async (req, res, next) => {

	const errors = [];

	//make sure they checked 1-10 posts
	if (!req.body.checkedposts || req.body.checkedposts.length === 0 || req.body.checkedposts.length > 10) {
		errors.push('Must select 1-10 posts');
	}
	//checked reports
	if (req.body.checkedreports) {
		if (!req.body.report_ban) {
			errors.push('Must select a report action if checked reports');
		}
		if (req.body.checkedreports.length > 50) {
			//50 because checked posts is max 10 and 5 reports max per post
			errors.push('Cannot check more than 50 reports');
		}
	}

	res.locals.actions = actionChecker(req);

	//make sure they selected at least 1 action
	if (res.locals.actions.validActions.length === 0) {
		errors.push('No actions selected');
	}

	//check if they have permission to perform the actions
	if (res.locals.permLevel > res.locals.actions.authRequired) {
		errors.push('No permission');
	}
	if (res.locals.permLevel >= 4) {
		if (req.body.delete && !res.locals.board.settings.userPostDelete) {
			errors.push('Post deletion is disabled on this board');
		}
		if (req.body.spoiler && !res.locals.board.settings.userPostSpoiler) {
			errors.push('File spoilers are disabled on this board');
		}
		if (req.body.unlink_file && !res.locals.board.settings.userPostUnlink) {
			errors.push('File unlinking is disabled on this board');
		}
	}

	//check that actions are valid
	if (req.body.password && req.body.password.length > 50) {
		errors.push('Password must be 50 characters or less');
	}
	if (req.body.report_reason && req.body.report_reason.length > 50) {
		errors.push('Report must be 50 characters or less');
	}
	if (req.body.ban_reason && req.body.ban_reason.length > 50) {
		errors.push('Ban reason must be 50 characters or less');
	}
	if (req.body.log_message && req.body.log_message.length > 50) {
		errors.push('Modlog must be 50 characters or less');
	}
	if ((req.body.report || req.body.global_report) && (!req.body.report_reason || req.body.report_reason.length === 0)) {
		errors.push('Reports must have a reason');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/`
		})
	}

	try {
		res.locals.posts = await Posts.getPosts(req.params.board, req.body.checkedposts, true);
	} catch (err) {
		return next(err);
	}
	if (!res.locals.posts || res.locals.posts.length === 0) {
		return res.status(404).render('message', {
			'title': 'Not found',
			'error': 'Selected posts not found',
			'redirect': `/${req.params.board}/`
		})
	}

	try {
		await actionHandler(req, res, next);
	} catch (err) {
		return next(err);
	}

}

