'use strict';

const { Posts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { globalLimits } = require(__dirname+'/../../configs/main.js')
	, actionHandler = require(__dirname+'/../../models/forms/actionhandler.js')
	, actionChecker = require(__dirname+'/../../helpers/checks/actionchecker.js');

module.exports = async (req, res, next) => {

	const errors = [];

	if (!req.body.globalcheckedposts || req.body.globalcheckedposts.length === 0) {
		errors.push(`Must select at least one post`);
	} else if (globalLimits.multiInputs.posts.staff
		&& req.body.globalcheckedposts.length > globalLimits.multiInputs.posts.staff) {
		errors.push(`Must not select >${globalLimits.multiInputs.posts.staff} posts per request`);
	}

	//checked reports
	if (req.body.checkedreports) {
		if (!req.body.global_report_ban) {
			errors.push('Must select a report action if checked reports');
		}
		if (req.body.checkedreports.length > req.body.globalcheckedposts.length*5) {
			//5 reports max per post
			errors.push('Invalid number of reports checked');
		}
	} else if (!req.body.checkedreports && req.body.global_report_ban) {
		errors.push('Must select posts+reports to report ban');
	}

	res.locals.actions = actionChecker(req);

	//make sure they have any global actions, and that they only selected global actions
	if (res.locals.actions.numGlobal === 0 || res.locals.actions.validActions.length > res.locals.actions.numGlobal) {
		errors.push('Invalid actions selected');
	}

	//check that actions are valid
	if (req.body.edit && req.body.globalcheckedposts.length > 1) {
		errors.push('Must select only 1 post for edit action');
	}
	if (req.body.postpassword && req.body.postpassword.length > globalLimits.fieldLength.postpassword) {
		errors.push(`Password must be ${globalLimits.fieldLength.postpassword} characters or less`);
	}
	if (req.body.ban_reason && req.body.ban_reason.length > globalLimits.fieldLength.ban_reason) {
		errors.push(`Ban reason must be ${globalLimits.fieldLength.ban_reason} characters or less`);
	}
	if (req.body.log_message && req.body.log_message.length > globalLimits.fieldLength.log_message) {
		errors.push(`Modlog message must be ${globalLimits.fieldLength.log_message} characters or less`);
	}

	//return the errors
	if (errors.length > 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/globalmanage/reports.html'
		})
	}

	//get posts with global ids only
	try {
		res.locals.posts = await Posts.globalGetPosts(req.body.globalcheckedposts, true);
	} catch (err) {
		return next(err);
	}
	if (!res.locals.posts || res.locals.posts.length === 0) {
		return dynamicResponse(req, res, 404, 'message', {
			'title': 'Not found',
			'errors': 'Selected posts not found',
			'redirect': '/globalmanage/reports.html'
		})
	}

	if (req.body.edit) {
		//edit post, only allowing one
		return res.render('editpost', {
			'post': res.locals.posts[0],
			'csrf': req.csrfToken(),
			'referer': (req.headers.referer || `/${res.locals.posts[0].board}/manage/thread/${res.locals.posts[0].thread || res.locals.posts[0].postId}.html`) + `#${res.locals.posts[0].postId}`,
		});
	}

	try {
		await actionHandler(req, res, next);
	} catch (err) {
		console.error(err);
		return next(err);
	}

}

