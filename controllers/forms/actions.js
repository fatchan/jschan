'use strict';

const { Posts, Boards } = require(__dirname+'/../../db/')
	, Permissions = require(__dirname+'/../../lib/permission/permissions.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, actionHandler = require(__dirname+'/../../models/forms/actionhandler.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, actionChecker = require(__dirname+'/../../lib/input/actionchecker.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		timeFields: ['ban_duration'],
		trimFields: ['postpassword', 'report_reason', 'ban_reason', 'log_message', 'move_to_board'],
		allowedArrays: ['checkedreports', 'checkedposts'],
		numberFields: ['move_to_thread', 'sticky'],
		numberArrays: ['checkedposts'],
	}),

	controller: async (req, res, next) => {

		const { globalLimits } = config.get;

		res.locals.actions = actionChecker(req, res);

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedposts, 1), expected: false, blocking: true, error: 'Must select at least one post' },
			{ result: lengthBody(res.locals.actions.validActions, 1), expected: false, blocking: true, error: 'No actions selected' },
			{ result: lengthBody(req.body.checkedposts, 1, globalLimits.multiInputs.posts.anon), permission: Permissions.MANAGE_BOARD_GENERAL, expected: false, error: `Must not select >${globalLimits.multiInputs.posts.anon} posts per request` },
			{ result: lengthBody(req.body.checkedposts, 1, globalLimits.multiInputs.posts.staff), expected: false, error: `Must not select >${globalLimits.multiInputs.posts.staff} posts per request` },
			{ result: (existsBody(req.body.report_ban) && !req.body.checkedreports), expected: false, error: 'Must select post and reports to ban reporter' },
			{ result: (existsBody(req.body.checkedreports) && !req.body.report_ban), expected: false, error: 'Must select a report action if checked reports' },
			{ result: (existsBody(req.body.checkedreports) && !req.body.checkedposts), expected: false, error: 'Must check parent post if checking reports for report action' },
			{ result: (existsBody(req.body.checkedreports) && existsBody(req.body.checkedposts) && lengthBody(req.body.checkedreports, 1, req.body.checkedposts.length*5)), expected: false, error: 'Invalid number of reports checked' },
			{ result: res.locals.actions.hasPermission, expected: true, blocking: true, error: 'No permission' },
			{ result: (existsBody(req.body.delete) && !res.locals.board.settings.userPostDelete), permission: Permissions.MANAGE_BOARD_GENERAL, expected: false, error: 'User post deletion is disabled on this board' },
			{ result: (existsBody(req.body.spoiler) && !res.locals.board.settings.userPostSpoiler), permission: Permissions.MANAGE_BOARD_GENERAL, expected: false, error: 'User file spoiling is disabled on this board' },
			{ result: (existsBody(req.body.unlink_file) && !res.locals.board.settings.userPostUnlink), permission: Permissions.MANAGE_BOARD_GENERAL, expected: false, error: 'User file unlinking is disabled on this board' },
			{ result: (existsBody(req.body.edit) && lengthBody(req.body.checkedposts, 1, 1)), expected: false, error: 'Must select only 1 post for edit action' },
			{ result: lengthBody(req.body.postpassword, 0, globalLimits.fieldLength.postpassword), expected: false, error: `Password must be ${globalLimits.fieldLength.postpassword} characters or less` },
			{ result: lengthBody(req.body.report_reason, 0, globalLimits.fieldLength.report_reason), expected: false, error: `Report must be ${globalLimits.fieldLength.report_reason} characters or less` },
			{ result: lengthBody(req.body.ban_reason, 0, globalLimits.fieldLength.ban_reason), expected: false, error: `Ban reason must be ${globalLimits.fieldLength.ban_reason} characters or less` },
			{ result: lengthBody(req.body.log_message, 0, globalLimits.fieldLength.log_message), expected: false, error: `Modlog message must be ${globalLimits.fieldLength.log_message} characters or less` },
			{ result: (existsBody(req.body.report || req.body.global_report) && lengthBody(req.body.report_reason, 1)), expected: false, blocking: true, error: 'Reports must have a reason' },
			{ result: (existsBody(req.body.move) && (!req.body.move_to_thread && !req.body.move_to_board)), expected: false, error: 'Must input destinaton thread number or board to move posts' },
			{ result: async () => {
				if (req.body.move && req.body.move_to_thread) {
					const moveBoard = req.body.move_to_board || req.params.board;
					res.locals.destinationThread = await Posts.getPost(moveBoard, req.body.move_to_thread);
					return res.locals.destinationThread != null;
				}
				return true;
			}, expected: true, error: 'Destination for move does not exist' },
			{ result: async () => {
				if (req.body.move && req.body.move_to_board
					&& req.body.move_to_board !== req.params.board) {
					if (!res.locals.user || !res.locals.user.username) {
						return false;
					}

					const destinationBoard = await Boards.findOne(req.body.move_to_board);
					if (res.locals.permissions.get(Permissions.MANAGE_GLOBAL_GENERAL)
						|| (res.locals.permissions.get(Permissions.MANAGE_BOARD_GENERAL)
							&& destinationBoard.staff[res.locals.user.username] != null)) {
						res.locals.destinationBoard = destinationBoard;
					}
					return res.locals.destinationBoard != null;
				}
				return true;
			}, expected: true, error: 'Destination for move does not exist, or you do not have permission' },
		], res.locals.permissions);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': `/${req.params.board}/`
			});
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
			});
		}

		if (req.body.edit) {
			//edit post only allows single post
			return res.redirect(`/${res.locals.posts[0].board}/manage/editpost/${res.locals.posts[0].postId || res.locals.posts[0].thread}.html`);
		} else if (req.body.move) {
			if (!res.locals.destinationBoard && !res.locals.destinationThread) {
				return dynamicResponse(req, res, 400, 'message', {
					'title': 'Bad Request',
					'error': 'Invalid post move destination',
					'redirect': `/${req.params.board}/`
				});
			}
			if (req.body.move_to_thread
				&& (!req.body.move_to_board || req.body.move_to_board === req.params.board)) {
				//If moving to thread on the same board, filter posts that are already in the destination thread
				res.locals.posts = res.locals.posts.filter(p => {
					return p.postId !== req.body.move_to_thread && p.thread !== req.body.move_to_thread;
				});
				if (res.locals.posts.length === 0) {
					return dynamicResponse(req, res, 409, 'message', {
						'title': 'Conflict',
						'error': 'Invalid selected posts or destination thread',
						'redirect': `/${req.params.board}/`
					});
				}
			}
		}

		try {
			await actionHandler(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
