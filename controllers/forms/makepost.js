'use strict';

const makePost = require(__dirname+'/../../models/forms/makepost.js')
	, deleteTempFiles = require(__dirname+'/../../helpers/files/deletetempfiles.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, pruneFiles = require(__dirname+'/../../schedules/prune.js')
	, { pruneImmediately, globalLimits, disableOnionFilePosting } = require(__dirname+'/../../configs/main.js')
	, { Files } = require(__dirname+'/../../db/');

module.exports = async (req, res, next) => {

	const errors = [];

	// even if force file and message are off, the post must contain one of either.
	if ((!req.body.message || res.locals.messageLength === 0) && res.locals.numFiles === 0) {
		errors.push('Posts must include a message or file');
	}
	if (res.locals.tor
		&& (disableOnionFilePosting || res.locals.board.settings.disableOnionFilePosting)
		&& res.locals.numFiles > 0) {
		errors.push(`Posting files through the .onion address has been disabled ${disableOnionFilePosting ? 'globally' : 'on this board'}`);
	}
	if (res.locals.numFiles > res.locals.board.settings.maxFiles) {
		errors.push(`Too many files. Max files per post ${res.locals.board.settings.maxFiles < globalLimits.postFiles.max ? 'on this board ' : ''}is ${res.locals.board.settings.maxFiles}`);
	}
	// check file, subject and message enforcement according to board settings
	if (!req.body.subject || req.body.subject.length === 0) {
		if (!req.body.thread && res.locals.board.settings.forceThreadSubject) {
			errors.push('Threads must include a subject');
		} //no option to force op subject, seems useless
	}
	if (globalLimits.postFiles.max !== 0 && res.locals.board.settings.maxFiles !== 0 && res.locals.numFiles === 0) {
		if (!req.body.thread && res.locals.board.settings.forceThreadFile) {
			errors.push('Threads must include a file');
		} else if (req.body.thread && res.locals.board.settings.forceReplyFile) {
			errors.push('Posts must include a file');
		}
	}
	if (!req.body.message || res.locals.messageLength === 0) {
		if (!req.body.thread && res.locals.board.settings.forceThreadMessage) {
			errors.push('Threads must include a message');
		} else if (req.body.therad && res.locals.board.settings.forceReplyMessage) {
			errors.push('Posts must include a message');
		}
	}
	if (req.body.message) {
		if (res.locals.messageLength > globalLimits.fieldLength.message) {
			errors.push(`Message must be ${globalLimits.fieldLength.message} characters or less`);
		} else if (!req.body.thread
			&& res.locals.board.settings.maxThreadMessageLength
			&& res.locals.messageLength > res.locals.board.settings.maxThreadMessageLength) {
			errors.push(`Thread messages must be ${res.locals.board.settings.maxThreadLength} characters or less`);
		} else if (req.body.thread
			&& res.locals.board.settings.maxReplyMessageLength
			&& res.locals.messageLength > res.locals.board.settings.maxReplyMessageLength) {
			errors.push(`Reply messages must be ${res.locals.board.settings.maxReplyMessageLength} characters or less`);
		} else if (!req.body.thread && res.locals.messageLength < res.locals.board.settings.minThreadMessageLength) {
			errors.push(`Thread messages must be at least ${res.locals.board.settings.minThreadMessageLength} characters long`);
		} else if (req.body.thread && res.locals.messageLength < res.locals.board.settings.minReplyMessageLength) {
			errors.push(`Reply messages must be at least ${res.locals.board.settings.minReplyMessageLength} characters long`);
		}
	}

	// subject, email, name, password limited length
	if (req.body.postpassword && req.body.postpassword.length > globalLimits.fieldLength.postpassword) {
		errors.push(`Password must be ${globalLimits.fieldLength.postpassword} characters or less`);
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

	if (errors.length > 0) {
		await deleteTempFiles(req).catch(e => console.error);
		return dynamicResponse(req, res, 400, 'message', {
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
			const incedFiles = req.files.file.filter(x => x.inced === true && x.filename != null);
			const incedFileNames = incedFiles.map(x => x.filename);
			await Files.decrement(incedFileNames).catch(e => console.error);
			await pruneFiles(incedFileNames);
		}
		return next(err);
	}

}
