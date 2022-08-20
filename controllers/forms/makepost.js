'use strict';

const makePost = require(__dirname+'/../../models/forms/makepost.js')
	, deleteTempFiles = require(__dirname+'/../../lib/file/deletetempfiles.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, { func: pruneFiles } = require(__dirname+'/../../schedules/tasks/prune.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, { Files } = require(__dirname+'/../../db/')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['message', 'name', 'subject', 'email', 'postpassword', 'password'],
		allowedArrays: ['spoiler', 'strip_filename'],
		processMessageLength: true,
		numberFields: ['thread'],
	}),

	controller: async (req, res, next) => {

		const { globalLimits, disableAnonymizerFilePosting } = config.get;

		const hasNoMandatoryFile = globalLimits.postFiles.max !== 0 && res.locals.board.settings.maxFiles !== 0 && res.locals.numFiles === 0;
			//maybe add more duplicates here?

		const errors = await checkSchema([
			{ result: (lengthBody(req.body.message, 1) && res.locals.numFiles === 0), expected: false, error: 'Posts must include a message or file' },
			{ result: (res.locals.anonymizer && (disableAnonymizerFilePosting || res.locals.board.settings.disableAnonymizerFilePosting)
				&& res.locals.numFiles > 0), expected: false, error: `Posting files through anonymizers has been disabled ${disableAnonymizerFilePosting ? 'globally' : 'on this board'}` },
			{ result: res.locals.numFiles > res.locals.board.settings.maxFiles, blocking: true, expected: false, error: `Too many files. Max files per post ${res.locals.board.settings.maxFiles < globalLimits.postFiles.max ? 'on this board ' : ''}is ${res.locals.board.settings.maxFiles}` },
			{ result: (lengthBody(req.body.subject, 1) && (!existsBody(req.body.thread)
				&& res.locals.board.settings.forceThreadSubject)), expected: false, error: 'Threads must include a subject' },
			{ result: lengthBody(req.body.message, 1) && (!existsBody(req.body.thread)
				&& res.locals.board.settings.forceThreadMessage), expected: false, error: 'Threads must include a message' },
			{ result: lengthBody(req.body.message, 1) && (existsBody(req.body.thread)
				&& res.locals.board.settings.forceReplyMessage), expected: false, error: 'Replies must include a message' },
			{ result: hasNoMandatoryFile && !existsBody(req.body.thread) && res.locals.board.settings.forceThreadFile , expected: false, error: 'Threads must include a file' },
			{ result: hasNoMandatoryFile && existsBody(req.body.thread) && res.locals.board.settings.forceReplyFile , expected: false, error: 'Replies must include a file' },
			{ result: lengthBody(req.body.message, 0, globalLimits.fieldLength.message), expected: false, blocking: true, error: `Message must be ${globalLimits.fieldLength.message} characters or less` },
			{ result: existsBody(req.body.message) && existsBody(req.body.thread) && lengthBody(req.body.message, res.locals.board.settings.minReplyMessageLength, res.locals.board.settings.maxReplyMessageLength),
				expected: false, error: `Reply messages must be ${res.locals.board.settings.minReplyMessageLength}-${res.locals.board.settings.maxReplyMessageLength} characters` },
			{ result: existsBody(req.body.message) && !existsBody(req.body.thread) && lengthBody(req.body.message, res.locals.board.settings.minThreadMessageLength, res.locals.board.settings.maxThreadMessageLength),
				expected: false, error: `Thread messages must be ${res.locals.board.settings.minThreadMessageLength}-${res.locals.board.settings.maxThreadMessageLength} characters` },
			{ result: lengthBody(req.body.postpassword, 0, globalLimits.fieldLength.postpassword), expected: false, error: `Password must be ${globalLimits.fieldLength.postpassword} characters or less` },
			{ result: lengthBody(req.body.name, 0, globalLimits.fieldLength.name), expected: false, error: `Name must be ${globalLimits.fieldLength.name} characters or less` },
			{ result: lengthBody(req.body.subject, 0, globalLimits.fieldLength.subject), expected: false, error: `Subject must be ${globalLimits.fieldLength.subject} characters or less` },
			{ result: lengthBody(req.body.email, 0, globalLimits.fieldLength.email), expected: false, error: `Email must be ${globalLimits.fieldLength.email} characters or less` },
		]);

		if (errors.length > 0) {
			await deleteTempFiles(req).catch(console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'errors': errors,
				'redirect': `/${req.params.board}${req.body.thread ? '/thread/' + req.body.thread + '.html' : ''}`
			});
		}

		try {
			await makePost(req, res, next);
		} catch (err) {
			await deleteTempFiles(req).catch(console.error);
			if (res.locals.numFiles > 0) {
				const incedFiles = req.files.file.filter(x => x.inced === true && x.filename != null);
				if (incedFiles.length > 0) {
					const incedFileNames = incedFiles.map(x => x.filename);
					await Files.decrement(incedFileNames).catch(console.error);
					await pruneFiles(incedFileNames);
				}
			}
			return next(err);
		}

	}

};
