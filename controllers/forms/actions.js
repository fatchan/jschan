'use strict';

const { Posts } = require(__dirname+'/../../db/')
	, { globalLimits } = require(__dirname+'/../../configs/main.js')
	, actionHandler = require(__dirname+'/../../models/forms/actionhandler.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, actionChecker = require(__dirname+'/../../helpers/checks/actionchecker.js');

module.exports = async (req, res, next) => {

	const errors = [];

	//make sure they checked 1-10 posts
	if (!req.body.checkedposts || req.body.checkedposts.length === 0) {
		errors.push('Must select at least one post');
	} else if (res.locals.permLevel >= 4 && globalLimits.multiInputs.posts.anon
		&& req.body.checkedposts.length > globalLimits.multiInputs.posts.anon) {
		errors.push(`Must not select >${globalLimits.multiInputs.posts.anon} posts per request`);
	} else if (globalLimits.multiInputs.posts.staff
		&& req.body.checkedposts.length > globalLimits.multiInputs.posts.staff) {
		errors.push(`Must not select >${globalLimits.multiInputs.posts.staff} posts per request`);
	}
	//checked reports
	if (req.body.checkedreports) {
		if (!req.body.report_ban) {
			errors.push('Must select a report action if checked reports');
		}
		if (req.body.checkedreports.length > req.body.checkedposts.length*5) {
			//5 reports max per post
			errors.push('Invalid number of reports checked');
		}
	} else if (!req.body.checkedreports && req.body.report_ban) {
		errors.push('Must select post and reports to ban reporter');
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
	if (req.body.edit && req.body.checkedposts && req.body.checkedposts.length > 1) {
		errors.push('Must select only 1 post for edit action');
	}
	if (req.body.postpassword && req.body.postpassword.length > globalLimits.fieldLength.postpassword) {
		errors.push(`Password must be ${globalLimits.fieldLength.postpassword} characters or less`);
	}
	if (req.body.report_reason && req.body.report_reason.length > globalLimits.fieldLength.report_reason) {
		errors.push(`Report must be ${globalLimits.fieldLength.report_reason} characters or less`);
	}
	if (req.body.ban_reason && req.body.ban_reason.length > globalLimits.fieldLength.ban_reason) {
		errors.push(`Ban reason must be ${globalLimits.fieldLength.ban_reason} characters or less`);
	}
	if (req.body.log_message && req.body.log_message.length > globalLimits.fieldLength.log_message) {
		errors.push(`Modlog message must be ${globalLimits.fieldLength.log_message} characters or less`);
	}
	if ((req.body.report || req.body.global_report) && (!req.body.report_reason || req.body.report_reason.length === 0)) {
		errors.push('Reports must have a reason');
	}
	if (req.body.move) {
		if (!req.body.move_to_thread) {
			errors.push('Must input destinaton thread number to move posts');
		} else if (req.body.move_to_thread) {
			const destinationThread = await Posts.threadExists(req.params.board, req.body.move_to_thread);
			if (!destinationThread) {
				errors.push('Destination thread for move does not exist');
			}
		}
	}

	if (errors.length > 0) {
		return dynamicResponse(req, res, 400, 'message', {
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
		return dynamicResponse(req, res, 404, 'message', {
			'title': 'Not found',
			'error': 'Selected posts not found',
			'redirect': `/${req.params.board}/`
		})
	}

	if (req.body.edit) {
		//edit post, only allowing one
		return res.render('editpost', {
			'post': res.locals.posts[0],
			'csrf': req.csrfToken(),
		});
	} else if (req.body.move) {
		res.locals.posts = res.locals.posts.filter(p => {
			//filter to remove any posts already in the thread (or the OP) of move destionation
			return p.postId !== req.body.move_to_thread && p.thread !== req.body.move_to_thread;
		});
		if (res.locals.posts.length === 0) {
			return dynamicResponse(req, res, 429, 'message', {
				'title': 'Conflict',
				'error': 'Destionation thread cannot match source thread for move action',
				'redirect': `/${req.params.board}/`
			});
		}
	}

	try {
		await actionHandler(req, res, next);
	} catch (err) {
		return next(err);
	}

}

