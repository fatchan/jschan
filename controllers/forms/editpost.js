'use strict';

const editPost = require(__dirname+'/../../models/forms/editpost.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { globalLimits } = require(__dirname+'/../../configs/main.js')
	, { Posts, Boards } = require(__dirname+'/../../db/');

module.exports = async (req, res, next) => {

	const errors = [];

	if ((!req.body.board || req.body.board.length === 0)
		|| (!req.body.postId || typeof req.body.postId !== 'number')) {
		errors.push('Missing board and postId form data');
	}
	// message, subject, email, name, limited length
	if (req.body.message && req.body.message.length > globalLimits.fieldLength.message) {
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

	try {
		await editPost(req, res, next);
	} catch (err) {
		return next(err);
	}

}
