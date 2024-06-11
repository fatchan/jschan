'use strict';

const makePost = require(__dirname+'/../../models/forms/makepost.js')
	, { Permissions } = require(__dirname+'/../../lib/permission/permissions.js')
	, deleteTempFiles = require(__dirname+'/../../lib/file/deletetempfiles.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, { func: pruneFiles } = require(__dirname+'/../../schedules/tasks/prune.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, { Files } = require(__dirname+'/../../db/')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, existsBody } = require(__dirname+'/../../lib/input/schema.js')
	, { recover: web3EthAccountsRecover } = require('web3-eth-accounts');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['message', 'name', 'subject', 'email', 'postpassword', 'password', 'signature'],
		allowedArrays: ['spoiler', 'strip_filename'],
		processMessageLength: true,
		numberFields: ['thread'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const { globalLimits, disableAnonymizerFilePosting, enableWeb3 } = config.get;

		const hasNoMandatoryFile = globalLimits.postFiles.max !== 0 && res.locals.board.settings.maxFiles !== 0 && res.locals.numFiles === 0;
		const disableBoardAnonymizerFilePosting = res.locals.board.settings.disableAnonymizerFilePosting && !res.locals.permissions.get(Permissions.MANAGE_BOARD_GENERAL);

		const errors = await checkSchema([
			{ result: (lengthBody(req.body.message, 1) && res.locals.numFiles === 0), expected: false, error: __('Posts must include a message or file') },
			{ result: (res.locals.anonymizer && (disableAnonymizerFilePosting || disableBoardAnonymizerFilePosting)
				&& res.locals.numFiles > 0 && !res.locals.permissions.get(Permissions.BYPASS_ANONYMIZER_RESTRICTIONS)), expected: false, error: __(`Posting files through anonymizers has been disabled ${disableAnonymizerFilePosting ? 'globally' : 'on this board'}`) },
			{ result: res.locals.numFiles > res.locals.board.settings.maxFiles, blocking: true, expected: false, error: __(`Too many files. Max files per post ${res.locals.board.settings.maxFiles < globalLimits.postFiles.max ? 'on this board ' : ''}is %s`, res.locals.board.settings.maxFiles) },
			{ result: (lengthBody(req.body.subject, 1) && (!existsBody(req.body.thread)
				&& res.locals.board.settings.forceThreadSubject)), expected: false, error: __('Threads must include a subject') },
			{ result: lengthBody(req.body.message, 1) && (!existsBody(req.body.thread)
				&& res.locals.board.settings.forceThreadMessage), expected: false, error: __('Threads must include a message') },
			{ result: lengthBody(req.body.message, 1) && (existsBody(req.body.thread)
				&& res.locals.board.settings.forceReplyMessage), expected: false, error: __('Replies must include a message') },
			{ result: hasNoMandatoryFile && !existsBody(req.body.thread) && res.locals.board.settings.forceThreadFile , expected: false, error: __('Threads must include a file') },
			{ result: hasNoMandatoryFile && existsBody(req.body.thread) && res.locals.board.settings.forceReplyFile , expected: false, error: __('Replies must include a file') },
			{ result: lengthBody(req.body.message, 0, globalLimits.fieldLength.message), expected: false, blocking: true, error: __('Message must be %s characters or less', globalLimits.fieldLength.message) },
			{ result: existsBody(req.body.message) && existsBody(req.body.thread) && lengthBody(req.body.message, res.locals.board.settings.minReplyMessageLength, res.locals.board.settings.maxReplyMessageLength),
				expected: false, error: __('Reply messages must be %s-%s characters', res.locals.board.settings.minReplyMessageLength, res.locals.board.settings.maxReplyMessageLength) },
			{ result: existsBody(req.body.message) && !existsBody(req.body.thread) && lengthBody(req.body.message, res.locals.board.settings.minThreadMessageLength, res.locals.board.settings.maxThreadMessageLength),
				expected: false, error: __('Thread messages must be %s-%s characters', res.locals.board.settings.minThreadMessageLength, res.locals.board.settings.maxThreadMessageLength) },
			{ result: lengthBody(req.body.postpassword, 0, globalLimits.fieldLength.postpassword), expected: false, error: __('Password must be %s characters or less', globalLimits.fieldLength.postpassword) },
			{ result: lengthBody(req.body.name, 0, globalLimits.fieldLength.name), expected: false, error: __('Name must be %s characters or less', globalLimits.fieldLength.name) },
			{ result: lengthBody(req.body.subject, 0, globalLimits.fieldLength.subject), expected: false, error: __('Subject must be %s characters or less', globalLimits.fieldLength.subject) },
			{ result: lengthBody(req.body.email, 0, globalLimits.fieldLength.email), expected: false, error: __('Email must be %s characters or less', globalLimits.fieldLength.email) },
			{ result: async () => {
				if (enableWeb3 === true && res.locals.board.settings.enableWeb3 === true
					&& req.body.message && req.body.signature && req.body.signature.length < 200) {
					try {
						const fixedMessage = req.body.rawMessage.replace(/\r\n/igm, '\n');
						res.locals.recoveredAddress = await web3EthAccountsRecover(fixedMessage, req.body.signature);
						return true;
					} catch (e) {
						console.warn(e);
						return false;
					}
				} else  {
					return true;
				}
			}, expected: true, error: __('Failed to verify message signature') },
		]);

		if (errors.length > 0) {
			await deleteTempFiles(req).catch(console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
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
