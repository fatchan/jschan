'use strict';

const editPost = require(__dirname+'/../../models/forms/editpost.js')
	, { Permissions } = require(__dirname+'/../../lib/permission/permissions.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, { Ratelimits, Posts } = require(__dirname+'/../../db/')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, numberBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['board', 'message', 'name', 'subject', 'email', 'log_message'],
		processMessageLength: true,
		numberFields: ['postId'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const { rateLimitCost, globalLimits } = config.get;

		const errors = await checkSchema([
			{ result: existsBody(req.body.board), expected: true, error: __('Missing board') },
			{ result: numberBody(req.body.postId, 1), expected: true, error: __('Missing postId') },
			{ result: lengthBody(req.body.message, 0, globalLimits.fieldLength.message), expected: false, error: __('Message must be %s characters or less', globalLimits.fieldLength.message) },
			{ result: lengthBody(req.body.name, 0, globalLimits.fieldLength.name), expected: false, error: __('Name must be %s characters or less', globalLimits.fieldLength.name) },
			{ result: lengthBody(req.body.subject, 0, globalLimits.fieldLength.subject), expected: false, error: __('Subject must be %s characters or less', globalLimits.fieldLength.subject) },
			{ result: lengthBody(req.body.email, 0, globalLimits.fieldLength.email), expected: false, error: __('Email must be %s characters or less', globalLimits.fieldLength.email) },
			{ result: lengthBody(req.body.log_message, 0, globalLimits.fieldLength.log_message), expected: false, error: __('Modlog message must be %s characters or less', globalLimits.fieldLength.log_message) },
			{ result: async () => {
				res.locals.post = await Posts.getPost(req.body.board, req.body.postId);
				return res.locals.post != null;
			}, expected: true, error: __('Post doesn\'t exist') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
			});
		}

		if (!res.locals.permissions.get(Permissions.BYPASS_RATELIMITS)) {
			const ratelimitUser = await Ratelimits.incrmentQuota(req.session.user, 'edit', rateLimitCost.editPost);
			const ratelimitIp = res.locals.anonymizer ? 0 : (await Ratelimits.incrmentQuota(res.locals.ip.cloak, 'edit', rateLimitCost.editPost));
			if (ratelimitUser > 100 || ratelimitIp > 100) {
				return dynamicResponse(req, res, 429, 'message', {
					'title': __('Ratelimited'),
					'error': __('You are editing posts too quickly, please wait a minute and try again'),
				});
			}
		}

		try {
			await editPost(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
