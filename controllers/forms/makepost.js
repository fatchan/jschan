'use strict';

const makePost = require(__dirname+'/../../models/forms/makepost.js')
	, deleteTempFiles = require(__dirname+'/../../helpers/files/deletetempfiles.js')
	, { Files } = require(__dirname+'/../../db/');

module.exports = async (req, res, next) => {

	if (req.files && req.files.file) {
		if (Array.isArray(req.files.file)) {
			res.locals.numFiles = req.files.file.filter(file => file.size > 0).length;
		} else {
			res.locals.numFiles = req.files.file.size > 0 ? 1 : 0;
			req.files.file = [req.files.file];
		}
		res.locals.numFiles = Math.min(res.locals.numFiles, res.locals.board.settings.maxFiles)
	}

	const errors = [];

	// even if force file and message are off, the post must contain one of either.
	if (!req.body.message && res.locals.numFiles === 0) {
		errors.push('Posts must include a message or file');
	}

	// check file, subject and message enforcement according to board settings
	if (!req.body.subject || req.body.subject.length === 0) {
		if (!req.body.thread && res.locals.board.settings.forceThreadSubject) {
			errors.push('Threads must include a subject');
		} //no option to force op subject, seems useless
	}
	if (res.locals.board.settings.maxFiles !== 0 && res.locals.numFiles === 0) {
		if (!req.body.thread && res.locals.board.settings.forceThreadFile) {
			errors.push('Threads must include a file');
		} else if (res.locals.board.settings.forceReplyFile) {
			errors.push('Posts must include a file');
		}
	}
	if (!req.body.message || req.body.message.length === 0) {
		if (!req.body.thread && res.locals.board.settings.forceThreadMessage) {
			errors.push('Threads must include a message');
		} else if (res.locals.board.settings.forceReplyMessage) {
			errors.push('Posts must include a message');
		}
	}
	if (req.body.message) {
		if (req.body.message.length > 4000) {
			errors.push('Message must be 4000 characters or less');
		} else if (!req.body.thread && req.body.message.length < res.locals.board.settings.minThreadMessageLength) {
			errors.push(`Thread messages must be at least ${res.locals.board.settings.minMessageLength} characters long`);
		} else if (req.body.thread && req.body.message.length < res.locals.board.settings.minReplyMessageLength) {
			errors.push(`Reply messages must be at least ${res.locals.board.settings.minMessageLength} characters long`);
		}
	}

	// subject, email, name, password limited length
	if (req.body.name && req.body.name.length > 50) {
		errors.push('Name must be 50 characters or less');
	}
	if (req.body.subject && req.body.subject.length > 50) {
		errors.push('Subject must be 50 characters or less');
	}
	if (req.body.email && req.body.email.length > 50) {
		errors.push('Email must be 50 characters or less');
	}
	if (req.body.password && req.body.password.length > 50) {
		errors.push('Password must be 50 characters or less');
	}

	if (errors.length > 0) {
		await deleteTempFiles(req).catch(e => console.error);
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}${req.body.thread ? '/thread/' + req.body.thread + '.html' : ''}`
		});
	}

	try {
		await makePost(req, res, next);
	} catch (err) {
		await deleteTempFiles(req).catch(e => console.error);
		if (res.locals.numFiles > 0) {
			await Files.decrement(req.files.file.filter(x => x.filename != null).map(x => x.filename)).catch(e => console.error);
		}
		return next(err);
	}

}
