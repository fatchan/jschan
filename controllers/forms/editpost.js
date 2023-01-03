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

		const { rateLimitCost, globalLimits } = config.get;

		const errors = await checkSchema([
			{ result: existsBody(req.body.board), expected: true, error: 'Missing board' },
			{ result: numberBody(req.body.postId, 1), expected: true, error: 'Missing postId' },
			{ result: lengthBody(req.body.message, 0, globalLimits.fieldLength.message), expected: false, error: `Message must be ${globalLimits.fieldLength.message} characters or less` },
			{ result: lengthBody(req.body.name, 0, globalLimits.fieldLength.name), expected: false, error: `Name must be ${globalLimits.fieldLength.name} characters or less` },
			{ result: lengthBody(req.body.subject, 0, globalLimits.fieldLength.subject), expected: false, error: `Subject must be ${globalLimits.fieldLength.subject} characters or less` },
			{ result: lengthBody(req.body.email, 0, globalLimits.fieldLength.email), expected: false, error: `Email must be ${globalLimits.fieldLength.email} characters or less` },
			{ result: lengthBody(req.body.log_message, 0, globalLimits.fieldLength.log_message), expected: false, error: `Modlog message must be ${globalLimits.fieldLength.log_message} characters or less` },
			{ result: async () => {
				res.locals.post = await Posts.getPost(req.body.board, req.body.postId);
				return res.locals.post != null;
			}, expected: true, error: 'Post doesn\'t exist' }
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
			});
		}

		if (!res.locals.permissions.get(Permissions.BYPASS_RATELIMITS)) {
			const ratelimitUser = await Ratelimits.incrmentQuota(req.session.user, 'edit', rateLimitCost.editPost);
			const ratelimitIp = res.locals.anonymizer ? 0 : (await Ratelimits.incrmentQuota(res.locals.ip.cloak, 'edit', rateLimitCost.editPost));
			if (ratelimitUser > 100 || ratelimitIp > 100) {
				return dynamicResponse(req, res, 429, 'message', {
					'title': 'Ratelimited',
					'error': 'You are editing posts too quickly, please wait a minute and try again',
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
