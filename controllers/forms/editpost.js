'use strict';

const editPost = require(__dirname+'/../../models/forms/editpost.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, config = require(__dirname+'/../../config.js')
	, { Ratelimits, Posts, Boards } = require(__dirname+'/../../db/');

module.exports = async (req, res, next) => {

	const { rateLimitCost, globalLimits } = config.get;
	const errors = [];

	if ((!req.body.board || req.body.board.length === 0)
		|| (!req.body.postId || typeof req.body.postId !== 'number')) {
		errors.push('Missing board and postId form data');
	}
	// message, subject, email, name, limited length
	if (req.body.message && res.locals.messageLength > globalLimits.fieldLength.message) {
		errors.push(`Message must be ${globalLimits.fieldLength.message} characters or less`);
	}
	if (req.body.name && req.body.name.length > globalLimits.fieldLength.name) {
		errors.push(`Name must be ${globalLimits.fieldLength.name} characters or less`);
	}
	if (req.body.subject && req.body.subject.length > globalLimits.fieldLength.subject) {
		errors.push(`Subject must be ${globalLimits.fieldLength.subject} characters or less`);
	}
	if (req.body.email && req.body.email.length > globalLimits.fieldLength.email) {
		errors.push(`Email must be ${globalLimits.fieldLength.email} characters or less`);
	}
	if (req.body.log_message && req.body.log_message.length > globalLimits.fieldLength.log_message) {
		errors.push(`Modlog message must be ${globalLimits.fieldLength.log_message} characters or less`);
	}

	try {
		res.locals.post = await Posts.getPost(req.body.board, req.body.postId);
	} catch (err) {
		return next(err);
	}

	if (!res.locals.board || !res.locals.post) {
		errors.push(`Post doesn't exist`);
	}

	if (errors.length > 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': errors,
		});
	}

	if (res.locals.permLevel > 1) { //if not global staff or above
		const ratelimitUser = await Ratelimits.incrmentQuota(req.session.user, 'edit', rateLimitCost.editPost);
//		const ratelimitIp = await Ratelimits.incrmentQuota(res.locals.ip.single, 'edit', rateLimitCost.editPost);
		if (ratelimitUser > 100 /* || ratelimitIp > 100 */) {
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
