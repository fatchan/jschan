'use strict';

const { debugLogs } = require(__dirname+'/../../../configs/secrets.js')
	, dynamicResponse = require(__dirname+'/../../misc/dynamic.js')
	, { addCallback } = require(__dirname+'/../../redis/redis.js')
	, upload = require('@fatchan/express-fileupload')
	, fileHandlers = {}
	, fileSizeLimitFunction = (req, res) => {
		return dynamicResponse(req, res, 413, 'message', {
			'title': 'Payload Too Large',
			'message': 'Your upload was too large',
			'redirect': req.headers.referer
		});
	}
	, missingExtensionLimitFunction = (req, res) => {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad Request',
			'message': 'Missing file extensions',
			'redirect': req.headers.referer
		});
	}
	, updateHandlers = () => {
		const { globalLimits,  filterFileNames, spaceFileNameReplacement } = require(__dirname+'/../../misc/config.js').get;
		['flag', 'banner', 'asset', 'post'].forEach(fileType => {
			const fileSizeLimit = globalLimits[`${fileType}FilesSize`];
			const fileNumLimit = globalLimits[`${fileType}Files`];
			const fileNumLimitFunction = (req, res) => {
				const isPostform = req.path.endsWith('/post') || req.path.endsWith('/modpost');
				return dynamicResponse(req, res, 400, 'message', {
					'title': 'Too many files',
					'message': (isPostform && res.locals.board) ? `Max files per post ${res.locals.board.settings.maxFiles < globalLimits.postFiles.max ? 'on this board ' : ''}is ${res.locals.board.settings.maxFiles}`
						: `Max files per request is ${fileNumLimit.max}`,
					'redirect': req.headers.referer
				});
			};
			fileHandlers[fileType] = upload({
				debug: debugLogs,
				createParentPath: true,
				safeFileNames: filterFileNames,
				spaceFileNameReplacement,
				preserveExtension: 4,
				limits: {
					totalSize: fileSizeLimit.max,
					fileSize: fileSizeLimit.max,
					files: fileNumLimit.max,
				},
				limitHandler: fileSizeLimitFunction,
				numFilesLimitHandler: fileNumLimitFunction,
				extensionLimitHandler: missingExtensionLimitFunction,
				useTempFiles: true,
				tempFileDir: __dirname+'/../../../tmp/'
			});
		});
	};

updateHandlers();
addCallback('config', updateHandlers);

module.exports = {

	asset: (req, res, next) => {
		return fileHandlers.asset(req, res, next);
	},
	banner: (req, res, next) => {
		return fileHandlers.banner(req, res, next);
	},
	flag: (req, res, next) => {
		return fileHandlers.flag(req, res, next);
	},
	posts: (req, res, next) => {
		if (res.locals.anonymizer) {
			return next();
		}
		return fileHandlers.post(req, res, next);
	},
	postsEarly: (req, res, next) => {
		if (res.locals.anonymizer) {
			return fileHandlers.post(req, res, next);
		}
		return next();
	},

};
