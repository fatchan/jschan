'use strict';

const { Posts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, actionHandler = require(__dirname+'/../../models/forms/actionhandler.js')
	, actionChecker = require(__dirname+'/../../lib/input/actionchecker.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		timeFields: ['ban_duration'],
		trimFields: ['postpassword', 'report_reason', 'ban_reason', 'log_message'],
		allowedArrays: ['checkedreports', 'globalcheckedposts'],
		numberFields: ['move_to_thread'],
		objectIdArrays: ['globalcheckedposts']
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const { globalLimits } = config.get;

		res.locals.actions = actionChecker(req, res);

		const errors = await checkSchema([
			{ result: lengthBody(req.body.globalcheckedposts, 1), expected: false, blocking: true, error: __('Must select at least one post') },
			{ result: lengthBody(res.locals.actions.validActions, 1), expected: false, blocking: true, error: __('No actions selected') },
			{ result: lengthBody(req.body.globalcheckedposts, 1, globalLimits.multiInputs.posts.staff), expected: false, error: __('Must not select >%s posts per request', globalLimits.multiInputs.posts.staff) },
			{ result: (existsBody(req.body.global_report_ban) && !req.body.checkedreports), expected: false, error: __('Must select post and reports to ban reporter') },
			{ result: (existsBody(req.body.checkedreports) && !req.body.global_report_ban), expected: false, error: __('Must select a report action if checked reports') },
			{ result: (existsBody(req.body.checkedreports) && !req.body.globalcheckedposts), expected: false, error: __('Must check parent post if checking reports for report action') },
			{ result: (existsBody(req.body.checkedreports) && req.body.globalcheckedposts
				&& lengthBody(req.body.checkedreports, 1, req.body.globalcheckedposts.length*5)), expected: false, error: __('Invalid number of reports checked') },
			{ result: (res.locals.actions.numGlobal > 0 && res.locals.actions.validActions.length <= res.locals.actions.numGlobal), expected: true, blocking: true, error: __('Invalid actions selected') },
			{ result: res.locals.actions.hasPermission, expected: true, blocking: true, error: __('No permission') },
			{ result: (existsBody(req.body.edit) && lengthBody(req.body.globalcheckedposts, 1, 1)), expected: false, error: __('Must select only 1 post for edit action') },
			{ result: lengthBody(req.body.postpassword, 0, globalLimits.fieldLength.postpassword), expected: false, error: __('Password must be %s characters or less', globalLimits.fieldLength.postpassword) },
			{ result: lengthBody(req.body.ban_reason, 0, globalLimits.fieldLength.ban_reason), expected: false, error: __('Ban reason must be %s characters or less', globalLimits.fieldLength.ban_reason) },
			{ result: lengthBody(req.body.log_message, 0, globalLimits.fieldLength.log_message), expected: false, error: __('Modlog message must be %s characters or less', globalLimits.fieldLength.log_message) },
		]);

		//return the errors
		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': '/globalmanage/reports.html'
			});
		}

		//get posts with global ids only
		try {
			res.locals.posts = await Posts.globalGetPosts(req.body.globalcheckedposts, true);
		} catch (err) {
			return next(err);
		}
		if (!res.locals.posts || res.locals.posts.length === 0) {
			return dynamicResponse(req, res, 404, 'message', {
				'title': __('Not found'),
				'error': __('Selected posts not found'),
				'redirect': '/globalmanage/reports.html'
			});
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

};
